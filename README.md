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
      "title":"Un d\u00e9saccord sur l'importance de divers emplois",
      "ressources_kiwix_export":"Un_D\u00e9saccord_Sur_L\u2019Importance_De_Divers_Emplois",
      "level":2,
      "author_book":"Beatrice Inzikuru",
      "book_editor":"African Storybook",
      "collection":null,
      "book_theme":"Sujet de soci\u00e9t\u00e9",
      "question_export":[
         {
            "question":"A propos de quel sujet les villageois ne s'entendent-ils pas ? ",
            "correct_answer":"De l'importance de leurs emplois",
            "wrong_answer":[
               "De l'importance des r\u00e9coltes",
               "De l'importance des \u00e9tudes"
            ]
         },
         {
            "question":"Pourquoi le professeur pense que son m\u00e9tier est le plus important ?",
            "correct_answer":"Sans lui personne ne peut apprendre",
            "wrong_answer":[
               "Sans lui il n'y a pas de livres",
               "Sans lui il n'y a pas d'enfants en classe"
            ]
         },
         {
            "question":"Le menuisier pense que son travail est le plus important. Pourquoi ?",
            "correct_answer":"Sans lui personne ne peut construire des maisons et des \u00e9coles",
            "wrong_answer":[
               "Sans lui personne n'a de meubles",
               "Sans lui il n'y a pas de jardins "
            ]
         },
         {
            "question":"Que d\u00e9clare l'\u00e9l\u00e8ve aux villageois ?",
            "correct_answer":"Sans les \u00e9l\u00e8ves il n'y a aucun m\u00e9tier",
            "wrong_answer":[
               "Aucun m\u00e9tier n'est important",
               "Personne n'est indispensable"
            ]
         },
         {
            "question":"Que font les villageois apr\u00e8s cette d\u00e9claration ? ",
            "correct_answer":"Ils admettent que chacun doit d'abord \u00eatre un \u00e9l\u00e8ve",
            "wrong_answer":[
               "Ils partent en vacances",
               "Ils se disputent"
            ]
         }
      ]
   }
]

```

Expects the PDF files to be in `medias/` folder
