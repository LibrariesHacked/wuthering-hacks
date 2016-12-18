# Wuthering Hacks

A data dashboard to display Newcastle libraries open data.

## What is it?

Newcastle public libraries publish as much of their data as possible under a (very open) Public Domain licence (https://creativecommons.org/publicdomain/zero/1.0/).  Details of existing datasets can be found at [Libraries data sets](https://www.newcastle.gov.uk/your-council-and-democracy/open-data-and-access-information/open-data/data-sets/libraries-data-sets)

They also have a GitHub account at [ToonLibraries](https://github.com/ToonLibraries) and an open data repository within this account at [library-open-data](https://github.com/ToonLibraries/library-open-data).

## Data provided

The dashboard uses 6 (unmodified) CSVs published by Newcastle libraries under the Public Domain licence.

| Data | Link | Description |
| ---- | ---- | --------- |
| Current Libraries | [CSV](https://www.newcastle.gov.uk/sites/default/files/wwwfileroot/your-council-and-democracy/open-data-and-access-information/open-data/data-sets/libraries-data-sets/libraries_ncc-libraries-current_csv.csv) | Location of current Newcastle City Council Libraries along with number of public access computers and Wi-Fi provision |
| Monthly computer usage | [CSV](https://www.newcastle.gov.uk/libraries-2008-2016-monthly-computer-use) | Monthly computer usage figures by branch for April 2008 to Present |
| Monthly enquiries | [CSV](https://www.newcastle.gov.uk/benefits-and-council-tax/libraries-2008-2016-monthly-enquiries-csv) | Monthly enquiry figures by branch for April 2008 to Present |
| Monthly issues | [CSV](https://www.newcastle.gov.uk/benefits-and-council-tax/libraries-2008-2016-monthly-issues-csv) | Monthly loan figures (number of items issued) by branch for April 2008 to Present |
| Online resources usage |  | Monthly usage figures for online resources including databases and e-book platforms when available, for January 2005 to present |
| Monthly visits | [CSV](https://www.newcastle.gov.uk/benefits-and-council-tax/libraries-2008-2016-monthly-visits-csv) | Monthly issue figures by branch for April 2008 to Present |
| City library energy consumption |  | Monthly electricity consumption at Newcastle City Library for January 2011 to December 2015 |
| City library gas consumption |  | Monthly gas consumption at Newcastle City Library for January 2011 to December 2015 |
| City library water consumption |  | Monthly water consumption at Newcastle City Library for January 2011 to December 2015 |


| Members | [CSV]() |

To avoid any cross domain issues, the code does not link directly to these files but uses a copy held within the project.  This does mean that updates to those open data files currently need to be manually copied into this project.  

## Data definitions 

The dashboard is designed to not mess with the Newcastle data in any way - if that's how it's published then the dashboard has to deal with it.  In a future project it would be useful to standardise those outputs into schemas that provide as much information as possible, in the most useful/efficient format.

### Libraries

| Field | Description | Example |
| ----- | ----------- | ------- |
| Library | The name of the library | *Blakelaw* |
| Type | The type of library (Library/Partnership Library/Library and Customer Service Centre) | *Library* |
| Computer Provision | The provision of computers to the public | *Public Computer Access* |
| No of PCs | The number of public access PCs | *8* |
| Wi-Fi Provision | The provision of Wi-Fi to the public | *Public Wi-Fi* |
| Latitude | The latitude geo-coordinate of the library | *54.984162* |
| Longitude | The longitude geo-coordinate of the library | *-1.660813* |

### Monthly enquiries

| Field | Description | Example |
| ----- | ----------- | ------- |
| Library | The name of the library |  |
| 2008-04 | The number of enquiries for the month | 312 |

...the columns go on to cover each month in the form of YYYY-MM.

### Monthly issues

| Field | Description | Example |
| ----- | ----------- | ------- |
| Library | The name of the library |  |
| 2008-04 | The number of issues for the month | 1048 |

...the columns go on to cover each month in the form of YYYY-MM.

### Monthly visits

| Field | Description | Example |
| ----- | ----------- | ------- |
| Library | The name of the library |  |
| 2008-04 | The number of visits for the month | 1768 |

...the columns go on to cover each month in the form of YYYY-MM.

### Monthly computer usage

| Field | Description | Example |
| ----- | ----------- | ------- |
| Library | The name of the library |  |
| 2008-04 | The percentage of computer utilisation | 50% |

...the columns go on to cover each month in the form of YYYY-MM.

### Members

| Field | Description | Example |
| ----- | ----------- | ------- |
| Postcode | The postcode district of the member | AB10 |
| Library Registered At | The library the member is registered at | CITY |
| Date Added | The date the user was added as a member | 04/09/15 or 04/08/2005 |
| Time Added | The time the user was added as a member | 8:45:00 or Empty |
| Last Used Date | The date the member last used services | 04/09/15 |
| Last Used Time | The time the member last used services | 8:45:00 |

### Online resources

## Technologies used and licences

The following technologies (with supporting licences) are included.

| Technology | Used for | Link | Licence |
| ---------- | -------- | ---- | ------- |
| Bootstrap | To provide the page structure | [Bootstrap](http://getbootstrap.com/) | [MIT](https://github.com/twbs/bootstrap/blob/master/LICENSE) |
| Bootswatch | A set of custom themes for Bootstrap. | [Bootswatch](https://bootswatch.com/) | [MIT](https://github.com/thomaspark/bootswatch/blob/gh-pages/LICENSE) |
| jQuery | Required by bootstrap and to provide JavaScript code shortcuts | [jQuery](https://jquery.com/) | [MIT](https://jquery.org/license/) |
| DC JS | Dimensional Charting JavaScript library - used for the dynamic charts | [dc.js](https://dc-js.github.io/dc.js/) | [Apache](https://github.com/dc-js/dc.js/blob/develop/LICENSE) |
| Crossfilter | Required by DC JS, provides the cross flitering functionality | [Crossfilter](http://square.github.io/crossfilter/) | [Apache](https://github.com/square/crossfilter/blob/master/LICENSE) |
| D3 | Required by DC JS, provides the data driven graphs | [D3JS](https://d3js.org/) | [BSD](https://github.com/d3/d3/blob/master/LICENSE) |
| Melt | JavaScript library to pivot data | [MeltJS](https://github.com/jrideout/melt.js) | [Apache](https://github.com/jrideout/melt.js/blob/master/LICENSE) |
| Leaflet | JavaScript library for mapping. |  |  |
| CartoJS | Specific functions for mappping using data stored in Carto. |  |  |