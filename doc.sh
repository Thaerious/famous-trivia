#!/bin/bash
sphinx-build -b html documentation/src/ documentation/build
firstString="$PWD"
doc_dir="${firstString/\/mnt\/d/"D:"}/documentation/build/index.html"  
echo $doc_dir  
/mnt/c/Program\ Files/Google/Chrome/Application/chrome.exe "$doc_dir"