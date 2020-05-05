import urllib.request 

files = [
  'https://raw.githubusercontent.com/ToonLibraries/library-open-data/master/computer-usage/2008-onwards-monthly-computer-use.csv',
  'https://raw.githubusercontent.com/ToonLibraries/library-open-data/master/enquiries/2008-onwards-monthly-enquiries.csv',
  'https://raw.githubusercontent.com/ToonLibraries/library-open-data/master/computer-usage/2008-onwards-monthly-computer-use.csv',
  'https://raw.githubusercontent.com/ToonLibraries/library-open-data/master/online-resources/Online%20Resources%20Usage.csv',
  'https://raw.githubusercontent.com/ToonLibraries/library-open-data/master/visitor-figures/2008-onwards-monthly-visits.csv'
]

for file in files:
  urllib.request.urlretrieve(file, '..//data//' + file[file.rfind("/")+1:])