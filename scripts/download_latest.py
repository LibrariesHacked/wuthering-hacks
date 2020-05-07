import urllib.request
from pathlib import Path

data_folder = Path('./data')

files = [
  'https://raw.githubusercontent.com/ToonLibraries/library-open-data/master/computer-usage/2008-onwards-monthly-computer-use.csv',
  'https://raw.githubusercontent.com/ToonLibraries/library-open-data/master/enquiries/2008-onwards-monthly-enquiries.csv',
  'https://raw.githubusercontent.com/ToonLibraries/library-open-data/master/visitor-figures/2008-onwards-monthly-visits.csv'
]

for file in files:
  urllib.request.urlretrieve(file, data_folder / file[file.rfind("/")+1:])