#!/usr/bin/env bash

# Download vendor-provided web assets

echo "Downloading PureCSS"
curl -o assets/pure-min.css https://cdn.jsdelivr.net/npm/purecss@3.0.0/build/pure-min.css
curl -o assets/grids-responsive-min.css https://cdn.jsdelivr.net/npm/purecss@3.0.0/build/grids-responsive-min.css

echo "Downloading Lottie"
curl -o assets/lottie.min.js https://raw.githubusercontent.com/airbnb/lottie-web/v5.10.1/build/player/lottie.min.js

echo "Downloading Varta WebFont"
folder=$(mktemp -d) && \
	curl -L -o $folder/Varta.font.zip https://webfonts.ffonts.net/Varta.font.zip && \
	unzip -d $folder $folder/Varta.font.zip && \
	mv $folder/Varta.ttf.{woff,eot,svg} assets/ && \
	rm -rf $folder

echo "Downloading select2"
folder=$(mktemp -d) && \
	curl -L -o $folder/4.1.0-rc.0.zip https://github.com/select2/select2/archive/refs/tags/4.1.0-rc.0.zip && \
	unzip -d $folder $folder/4.1.0-rc.0.zip && \
	mv $folder/select2-4.1.0-rc.0/dist/js/select2.full.min.js assets/ && \
	mv $folder/select2-4.1.0-rc.0/dist/js/i18n/fr.js assets/select2.fr.js && \
	mv $folder/select2-4.1.0-rc.0/dist/css/select2.min.css assets/ && \
	rm -rf $folder

echo "Downloading jQuery (select2 dep)"
curl -L -o assets/jquery-3.6.3.slim.min.js https://code.jquery.com/jquery-3.6.3.slim.min.js

echo "Downloading bootstrap (select2 theme dep)"
curl -L -o assets/bootstrap.min.css https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css
curl -L -o assets/bootstrap.bundle.min.js https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js
curl -L -o assets/select2-bootstrap-5-theme.min.css https://cdn.jsdelivr.net/npm/select2-bootstrap-5-theme@1.3.0/dist/select2-bootstrap-5-theme.min.css
