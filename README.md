# Wuthering Hacks

A data dashboard done from Newcastle public libraries open data.

## Technologies used and licences

Before the event the basic page was set up along with the supporting technologies.  The following technologies (with supporting licences) are included.

| Technology | Used for | Link | Licence |
| Bootstrap | To provide the page structure | [Bootstrap](http://getbootstrap.com/) | [MIT](https://github.com/twbs/bootstrap/blob/master/LICENSE) |
| jQuery | Required by bootstrap and to provide JavaScript code shortcuts | [jQuery](https://jquery.com/) | [MIT](https://jquery.org/license/) |
| DC JS | Dimensional Charting JavaScript library - used for the dynamic charts | |
| Crossfilter | Required by DC JS, provides the cross flitering functionality | |  |
| D3 | Required by DC JS, provides the data driven graphs | | |
| Melt | JavaScript library to pivot data |  |  |

## Data provided

The dashboard directly links to 6 CSVs published by Newcastle libraries under the Open Government Licence.

- Current Libraries - https://www.newcastle.gov.uk/sites/default/files/wwwfileroot/your-council-and-democracy/open-data-and-access-information/open-data/data-sets/libraries-data-sets/libraries_ncc-libraries-current_csv.csv
- Monthly enquiries - https://www.newcastle.gov.uk/benefits-and-council-tax/libraries-2008-2016-monthly-enquiries-csv
- Monthly issues - https://www.newcastle.gov.uk/benefits-and-council-tax/libraries-2008-2016-monthly-issues-csv
- Monthly visits - https://www.newcastle.gov.uk/benefits-and-council-tax/libraries-2008-2016-monthly-visits-csv
- Monthly computer usage - https://www.newcastle.gov.uk/libraries-2008-2016-monthly-computer-use
- Members - On Library Box

## Data definitions 

The dashboard is designed to not mess with that data in any way - if that's how it's published then the dashboard has to deal with it.  In a future project it would be useful to standardise those outputs into schemas that provide as much information as possible and that could be used by all authorities - providing a dashboard of all libraries.

### Libraries

| Field | Description | Example |
| Library | The name of the library | Blakelaw |
| Type | The type of library (Library/Partnership Library/Library and Customer Service Centre) | Library |
| Computer Provision | The provision of computers to the public | Public Computer Access |
| No of PCs | The number of public access PCs |  |
| Wi-Fi Provision | The provision of Wi-Fi to the public | Public Wi-Fi |
| Latitude | The latitude geocoordinate of the library | 54.984162 |
| Longitude | The longitude geocoordinate of the library | -1.660813 |

### Monthly enquiries

| Field | Description | Example |
| Library | The name of the library |  |
| 2008-04 | The number of enquiries for the month | 312 |

...the columns go on to cover each month in the form of YYYY-MM.

### Monthly issues

| Field | Description | Example |
| Library | The name of the library |  |
| 2008-04 | The number of issues for the month | 1048 |

...the columns go on to cover each month in the form of YYYY-MM.

### Monthly visits

| Field | Description | Example |
| Library | The name of the library |  |
| 2008-04 | The number of visits for the month | 1768 |

...the columns go on to cover each month in the form of YYYY-MM.

### Monthly computer usage

| Field | Description | Example |
| Library | The name of the library |  |
| 2008-04 | The percentage of computer utilisation | 50% |

...the columns go on to cover each month in the form of YYYY-MM.

### Members

| Field | Description | Example |
| Postcode | The postcode district of the member | AB10 |
| Library Registered At | The library the member is registered at | CITY |
| Date Added | The date the user was added as a member | 04/09/15 |
| Time Added | The time the user was added as a member | 8:45:00 |
| Last Used Date | The date the member last used services | 04/09/15 |
| Last Used Time | The time the member last used services | 8:45:00 |
