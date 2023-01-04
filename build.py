#!/usr/bin/env python3

import argparse
import datetime
import html
import json
import logging
import pathlib
import sys
from typing import Any, Dict, List, Tuple, Union

import slugify
from jinja2 import Environment, FileSystemLoader, select_autoescape
from zimscraperlib.download import stream_file
from zimscraperlib.logging import getLogger
from zimscraperlib.zim.creator import Creator

logger = getLogger("lilote", level=logging.DEBUG)
root_dir = pathlib.Path(__file__).parent
jinjenv = Environment(
    loader=FileSystemLoader(root_dir.joinpath("templates")),
    autoescape=select_autoescape(),
)


def get_slug(book: Dict[str, Any]) -> str:
    """title-based slug of a book for use in URL"""
    return slugify.slugify(book["title"], allow_unicode=True)


def normalize_all(value: Union[List, Dict]):
    """recursively normalize book values to remove html escaping"""
    if isinstance(value, dict):
        for key in value.keys():
            if isinstance(value[key], str):
                value[key] = html.unescape(value[key])
            elif isinstance(value[key], (list, dict)):
                normalize_all(value[key])
    elif isinstance(value, list):
        for index in range(len(value)):
            if isinstance(value[index], str):
                value[index] = html.unescape(value[index])
            elif isinstance(value[index], (list, dict)):
                normalize_all(value[index])


def get_pdf_url(asbid: int) -> str:
    """PDF url for an AfricanStobyBook ID"""
    return (
        "https://africanstorybook.org/read/"
        f"downloadbook.php?id={asbid}&a=1&d=0&layout=landscape"
    )


def get_cover_url(asbid: int):
    """PNG cover url for an AfricanStobyBook ID"""
    return f"https://africanstorybook.org/illustrations/covers/{asbid}.png"


class LiloteBuilder:
    def __init__(self, src_path: pathlib.Path, dst_path: pathlib.Path):
        self.src_path = src_path.expanduser().resolve()
        self.dst_path = dst_path.expanduser().resolve()

    def parse(self):
        with open(self.src_path, "r") as fh:
            self.books = json.load(fh)

        if not isinstance(self.books, list):
            raise ValueError("Unexpected type for books")

    def normalize_books(self):
        """apply systematic normalization to parsed books

        - adds slug to each book
        - html escape values
        - remove out-of-bound level values"""
        slugs = set()
        for book in self.books:
            # add slug, making sure there's no collision
            slug = get_slug(book)
            if slug in slugs:
                index = 2
                while index <= 50:
                    nslug = f"{slug}-{index}"
                    if nslug in slugs:
                        index += 1
                        continue
                    slug = nslug
            slugs.add(slug)
            book["slug"] = slug

            # html escape values
            normalize_all(book)

            # remove out-of-bound levels
            if book.get("level") not in ("1", "2", "3", "4", "5", "6"):
                book["level"] = None

    def start(self):
        self.creator = Creator(
            filename=self.dst_path,
            main_path="Accueil",
            favicon_path="illustration",
            language="fra",
            title="Lilote, Quiz de lecture",
            description="Des quiz de lecture sur 300 livres jeunesse",
            creator="Lilote.fr",
            publisher="openZIM",
            name="lilote_fr_test",
            tags=";".join(["jeunesse", "lecture"]),
            date=datetime.date.today(),
        ).config_verbose(True)
        self.creator.start()

    def finish(self):
        self.creator.finish()

    def add_illustrations(self):
        logger.debug("Adding illustrations")

        # resize to appropriate size (ZIM uses 48x48 so we double for retina)
        for size in (256, 128, 48):
            with open(
                root_dir.joinpath("assets").joinpath(f"logo-{size}x{size}.png"), "rb"
            ) as fh:
                self.creator.add_illustration(size, fh.read())
                if size == 256:
                    fh.seek(0)
                    self.creator.add_item_for(
                        path="favicon.png", mimetype="image/png", content=fh.read()
                    )

    def add_assets(self):
        """recursively add our own assets, at a path identical to position in repo"""
        assets_root = pathlib.Path(root_dir.joinpath("assets"))
        for fpath in assets_root.glob("**/*"):
            if not fpath.is_file():
                continue
            path = str(fpath.relative_to(root_dir))

            logger.debug(f"> {path}")
            self.creator.add_item_for(path=path, fpath=fpath)

    def add_pdf_for(self, slug: str, asbid: int) -> Tuple[bool, bool]:
        """download or retrieve PDF and add to ZIM"""
        cache = root_dir.joinpath("medias")
        cache.mkdir(exist_ok=True, parents=True)

        pdf_path = cache.joinpath(f"{asbid}.pdf")
        if not pdf_path.exists():
            stream_file(url=get_pdf_url(asbid), fpath=pdf_path)

        self.creator.add_item_for(
            path=f"{slug}.pdf",
            fpath=pdf_path,
            mimetype="application/pdf; charset=binary",
            is_front=False,
            should_compress=False,
            delete_fpath=False,
            duplicate_ok=True,
        )

    def add_cover_for(self, slug: str, asbid: int) -> Tuple[bool, bool]:
        """download or retrieve cover and add to ZIM"""
        cache = root_dir.joinpath("medias")
        cache.mkdir(exist_ok=True, parents=True)

        cover_path = cache.joinpath(f"{asbid}.png")
        if not cover_path.exists():
            stream_file(url=get_cover_url(asbid), fpath=cover_path)

        self.creator.add_item_for(
            path=f"{slug}.png",
            fpath=cover_path,
            mimetype="image/png",
            is_front=False,
            should_compress=False,
            delete_fpath=False,
            duplicate_ok=True,
        )

    def add_book_entries(self):
        for book in self.books:
            logger.debug(f"Adding {book['slug']}")

            if book.get("asbid"):
                try:
                    self.add_pdf_for(book["slug"], book["asbid"])
                except Exception as exc:
                    logger.error("Failed to include PDF: {exc}")
                    logger.exception(exc)
                    book["pdf"] = False
                else:
                    book["pdf"] = True

                try:
                    self.add_cover_for(book["slug"], book["asbid"])
                except Exception as exc:
                    logger.error("Failed to include cover: {exc}")
                    logger.exception(exc)
                    book["cover"] = False
                else:
                    book["cover"] = True

            self.creator.add_item_for(
                path=f"{book['slug']}.json",
                title="",
                mimetype="application/json",
                is_front=False,
                content=json.dumps(book, ensure_ascii=False),
            )
            self.creator.add_item_for(
                path=f"{book['slug']}.quiz",
                title=f"Quiz {book['title']}",
                mimetype="text/html",
                is_front=False,
                content=jinjenv.get_template("quiz.html").render(**book),
            )
            self.creator.add_item_for(
                path=book["slug"],
                title=book["title"],
                mimetype="text/html",
                is_front=True,
                content=jinjenv.get_template("book.html").render(**book),
            )

    def add_home(self):
        def get_text(book: Dict) -> str:
            text = book["title"]
            if "author_book" in book:
                text += f" de {book['author_book']}"
            if "book_editor" in book:
                text += f" ({book['book_editor']})"

            return text

        self.creator.add_item_for(
            path="books_list.json",
            title="",
            mimetype="application/json",
            is_front=False,
            content=json.dumps(
                [{"id": book["slug"], "text": get_text(book)} for book in self.books],
                ensure_ascii=False,
            ),
        )

        self.creator.add_item_for(
            path="Accueil",
            title="Accueil",
            mimetype="text/html",
            is_front=True,
            content=jinjenv.get_template("home.html").render(),
        )

    def run(self):
        if not self.src_path.exists():
            logger.critical(f"Source JSON missing at {self.src_path}")
            return 1
        logger.info(f"Starting LiloteBuilder from {self.src_path}")
        self.parse()
        self.normalize_books()
        logger.info(f"Found {len(self.books)} books")

        self.start()
        self.add_illustrations()
        self.add_assets()
        self.add_book_entries()
        self.add_home()
        self.finish()

        return 0


def entrypoint():
    parser = argparse.ArgumentParser(
        prog="lilote2zim",
        description="Create a ZIM file for Lilote Quizzes",
        epilog="See https://www.lilote.fr/",
    )

    parser.add_argument(
        dest="src_path",
        help="Lilote JSON Export file",
    )

    parser.add_argument(
        dest="dst_path",
        help="File path to write ZIM into",
    )

    kwargs = dict(parser.parse_args()._get_kwargs())
    kwargs["src_path"] = pathlib.Path(kwargs["src_path"])
    kwargs["dst_path"] = pathlib.Path(kwargs["dst_path"])

    try:
        app = LiloteBuilder(**kwargs)
        sys.exit(app.run())
    except Exception as exc:
        if kwargs.get("debug"):
            logger.exception(exc)
        logger.critical(str(exc))
        raise exc
        sys.exit(1)


if __name__ == "__main__":
    entrypoint()
