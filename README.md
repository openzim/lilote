# lilote

Generate a Lilote ZIM file from a Lilote export JSON

[![CodeFactor](https://www.codefactor.io/repository/github/openzim/lilote/badge)](https://www.codefactor.io/repository/github/openzim/lilote)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## Usage

```sh
# install vendor-provided files
❯ ./dl-deps.sh
# install python deps (in a venv)
❯ python3.11 -m venv .venv
❯ source .venv/bin/activate
❯ pip install -r requirements.txt

# build the ZIM file
❯ ./build.py lilote-export.json lilote_fr_all_$(date +"%Y-%m").zim
```

## JSON Format (example)

```json
[
   {
      "asbid": 10032,
      "title":"Some Title",
      "author_book":"An Author",
      "level":"4",
      "serie":"",
      "collection":"",
      "book_editor":"Editor",
      "book_theme":"Aventure",
      "accessibility":"",
      "question_export":[
         {
            "correct_answer":"Answer A",
            "question":"What is the answer?",
            "wrong_answer":[
               "Answer B",
               "Answer C"
            ]
         },
         {
            "correct_answer":"Answer A",
            "question":"What is the answer to this new one?",
            "wrong_answer":[
               "Answer B",
               "Answer C"
            ]
         }
      ]
   }
]

```

