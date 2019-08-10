Wuthering Hacks
===============

A data dashboard to display Newcastle libraries open data. Currently published at:

[https://newcastle.librarydata.uk](https://newcastle.librarydata.uk)

What is it?
-----------

Newcastle public libraries publish as much of their data as possible under a Public Domain licence (https://creativecommons.org/publicdomain/zero/1.0/). Details of existing datasets can be found at [Libraries data sets](https://www.newcastle.gov.uk/your-council-and-democracy/open-data-and-access-information/open-data/data-sets/libraries-data-sets).

They also have a GitHub account at [ToonLibraries](https://github.com/ToonLibraries), and an open data repository within this account at [library-open-data](https://github.com/ToonLibraries/library-open-data).

Dashboard pages
---------------

The dashboard splits visualisations into pages, focussing on different areas of the library data provided by Newcastle.

| Page | Description |
| ---- | ----------- |
| Usage | Details of issues, computer use, enquiries, and visits by month and by library |
| Catalogue | Details on the library catalogue - from titles and items data |
| Members | Details on membership by postcode area and date joined/active |
| Utilities | Details on gas, electricity and water consumption in the City library |
| Libraries | Full details on libraries, merged with geographic statistical data |

Data provided
-------------

The dashboard uses CSVs published by Newcastle libraries under the Public Domain licence.

| Data | Link | Description |
| ---- | ---- | --------- |
| Current Libraries | [CSV](https://www.newcastle.gov.uk/sites/default/files/wwwfileroot/your-council-and-democracy/open-data-and-access-information/open-data/data-sets/libraries-data-sets/libraries_ncc-libraries-current_csv.csv) | Location of current Newcastle City Council Libraries along with number of public access computers and Wi-Fi provision |
| Monthly computer usage | [CSV](https://www.newcastle.gov.uk/libraries-2008-2016-monthly-computer-use) | Monthly computer usage figures by branch for April 2008 to Present |
| Monthly enquiries | [CSV](https://www.newcastle.gov.uk/benefits-and-council-tax/libraries-2008-2016-monthly-enquiries-csv) | Monthly enquiry figures by branch for April 2008 to Present |
| Monthly issues | [CSV](https://www.newcastle.gov.uk/benefits-and-council-tax/libraries-2008-2016-monthly-issues-csv) | Monthly loan figures (number of items issued) by branch for April 2008 to Present |
| Online resources usage | [CSV](https://www.newcastle.gov.uk/sites/default/files/wwwfileroot/online_resources_usage.csv) | Monthly usage figures for online resources including databases and e-book platforms when available, for January 2005 to present |
| Monthly visits | [CSV](https://www.newcastle.gov.uk/benefits-and-council-tax/libraries-2008-2016-monthly-visits-csv) | Monthly issue figures by branch for April 2008 to Present |
| City library electricity consumption | [CSV](https://www.newcastle.gov.uk/your-council-and-democracy/open-data-and-access-information/open-data/data-sets/libraries-data-set-1) | Monthly electricity consumption at Newcastle City Library |
| City library gas consumption | [CSV](https://www.newcastle.gov.uk/your-council-and-democracy/open-data-and-access-information/open-data/data-sets/libraries-data-se-32) | Monthly gas consumption at Newcastle City Library |
| City library water consumption | [CSV](https://www.newcastle.gov.uk/your-council-and-democracy/open-data-and-access-information/open-data/data-sets/libraries-data-se-10) | Monthly water consumption at Newcastle City Library |
| Members | [CSV](https://raw.githubusercontent.com/ToonLibraries/library-open-data/master/membership/active%20members%20branch%20%26%20postcode%202016-04-06.csv) | Anonymised member data including postcode district, library registered at, date added and last used |
| Catalogue | [CSV](https://www.newcastle.gov.uk/sites/default/files/wwwfileroot/catalogue190916.csv) | Extract from the Library Management System (LMS) catalogue |
| Items | [CSV](https://www.newcastle.gov.uk/sites/default/files/wwwfileroot/items190916.csv) | Items in the Library Management System (LMS) catalogue |

The code does not link directly to these files but uses a copy held within the project. This means that updates to those open data files need to be manually copied into this project. See Build section for instructions.

Data definitions
----------------

The data that the dashboard uses is converted from the source data, and put into a format that is most efficient for the code to use.

However, the original data can be copied into this project when it is published. The definitions of the datasets used are included below.

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
| Library | The name of the library | *Blakelaw* |
| 2008-04 | The number of enquiries for the month | *312* |

The columns go on to cover each month in the form of YYYY-MM.

#### Comments

It would be nice to have this dataset with the month in a row, rather than a column header. For example:

| Field | Description | Example |
| ----- | ----------- | ------- |
| Library | The name of the library | *Blakelaw* |
| Month | The month | *2008-04* |
| Enquiries | The number of enquiries for the month | *312* |

That way the structure would be fixed to three columns and would increase in rows (rather than columns) as new months are added. The same applies to the following datasets on usage.

### Monthly issues

| Field | Description | Example |
| ----- | ----------- | ------- |
| Library | The name of the library | *Blakelaw* |
| 2008-04 | The number of issues for the month | *1048* |

### Monthly visits

| Field | Description | Example |
| ----- | ----------- | ------- |
| Library | The name of the library | *Blakelaw* |
| 2008-04 | The number of visits for the month | *1768* |

### Monthly computer usage

| Field | Description | Example |
| ----- | ----------- | ------- |
| Library | The name of the library | *Blakelaw* |
| 2008-04 | The percentage of computer utilisation | *50%* |

### Online resources usage

| Field | Description | Example |
| ----- | ----------- | ------- |
| Online Resource | The type of online resource | *19th Century British Library Newspapers* |
| Jan-05 | The usage figure for the month | *300* |

### Membership

| Field | Description | Example |
| ----- | ----------- | ------- |
| Postcode | The postcode district of the member | *AB10* |
| Library Registered At | The library the member is registered at | *CITY* |
| Date Added | The date the user was added as a member | *04/09/15* or *04/08/2005* |
| Time Added | The time the user was added as a member | *8:45:00* or Empty |
| Last Used Date | The date the member last used services | *04/09/15* |
| Last Used Time | The time the member last used services | *8:45:00* |

### Catalogue

| Field | Description | Example |
| ----- | ----------- | ------- |
| rcn | Unique identifier for the title | *413396703* |
| isbn | The International Standard Book Number of the title record | *9780413396709* |
| publ_y | The year the title was published | *1980* |
| author | Main author of the work | *Osborne, Charles* |
| title | Main title as on title page or equivalent | *W.H. Auden : the life of a poet* |
| price | Price of 1 copy | *£0.0* |
| langua | Main language of the work. Note: for most works in English the language is not specified. |  |
| editio | Edition or version of the work |  |
| class | Main classification allocated by library staff or by the supplier for the title | *821AUDE* |
| publisher | Name of the publisher | *EYRE METH* |
| firstcopydate | Date the first copy was added. Note: field rarely used. |  |
| acpy | Number of copies in stock for that ISBN | *1* |

#### Comments

It's probably down to the tool used to create the CSV, but the header is on the second row. The first row includes a timestamp.

```
__ Mon Sep,19 13:33:20 2016,______
```

Never mind though, it'll be easy enough to ignore. There seems to be a final column on the end that doesn't have any data in. Will ignore that. Pound (£) signs are included in the price column. I don't think there are any other currencies so will remove these and just have a decimal number. The number of copies sometimes seems to have a pipe character (|), maybe some remnant from a MARC field, so will also remove these.

### Items

| Field | Description | Example |
| ----- | ----------- | ------- |
| item | A unique ID for the item. | *C203255900* |
| rcn | The unique title record (links to the catalogue title data above). | *573011680* |
| catego | A category ID for the item. | *2* |
| text | Text for the category ID. | *ADULT NON FICTION* |
| homebr | An ID for the item branch. | *46* |
| name | Name of the item location. | *CITY STACK* |
| added | Date and time added to the catalogue. | *22/01/2007 14:26* |
| issues current branch | Number of issues at the current branch. | *0* |
| issues previous branch | Number of issues at the previous branch. | *0* |
| renewals current branch | Number of renewals at the current branch. | *0* |
| renewals previous branch | Number of renewals at the previous branch. | *0* |

Combining usage data
--------------------

To produce a file that is efficient to show for usage data, it's worth merging together a number of the files on usage: enquiries, issues, vists, and computer usage. Each of these include libraries and months, so when separate contain a lot of duplicated data.

The goal will be to produce a file to be used by the dashboard that looks like the following.

| Field | Description | Example |
| ----- | ----------- | ------- |
| Library | The name of the library | *Blakelaw* |
| Month | The month | *2008-04* |
| Enquiries | The number of enquiries for the month | *312* |
| Issues | *1048* |
| Visits | *1768* |
| Computer Usage | *50%* |

The data is created using a [python script](https://github.com/libraries-hacked/wuthering-hacks/scripts/combine_usage.py). This is included in the scripts directory of this project and prduces 1 file.

- dashboard_usage.csv

This file is then used in the usage page of the data dashboard.

Combining and aggregating catalogue and items
---------------------------------------------

Both the catalogue and item extracts are fairly large files (29MB and 27MB). Given that this project mainly processes data client-side (in the web browser), those files are too large to expect users to download.

We mainly need aggregated data (e.g. x thousand items, x thousand items of a particular category). For this purpose I have created a single aggregated dataset for catalogue and items. This is made smaller by using Ids for category and branch. These lookups are then included as a separate export.

| Field | Description | Example |
|------ | ----------- | ------- | 
| CategoryId | An integer ID of the category type. | *1* |
| Category | The textual name of the category. | *ADULT NON FICTION* |

| Field | Description | Example |
|------ | ----------- | ------- | 
| BranchId | An integer ID of the branch. | *0* |
| Branch | The textual name of the location. | *CITY STACK* |

| Field | Description | Example |
|------ | ----------- | ------- |
| CategoryId | Derived from the **text** field in the item data. | *1* |
| BranchId | Derived from the **name** field from the item table. | *1* |
| Added |  Month the items were added to the catalogue. | *2016-01* |
| Count | A count of the number of items. | *1* |
| Issues  | A count of the number of issues | **419757** |
| Renewals | A count of the number of renewals | **605263** |
| Price | Taken from the price field of the title data, in this case a total price for the items. Will be in pounds but with no symbol. | **462969.67** |

So, the above example would show that 

The data is created using a [python script](https://github.com/libraries-hacked/wuthering-hacks/scripts/aggregate_catalogue.py). This is included in the scripts directory of this project and prduces 3 files.

- dashboard_catalogue.csv
- dashboard_catalogue_grouped.csv
- dashboard_catalogue_branches.csv
- dashboard_catalogue_categories.csv

These files are then used in the catalogue page of the data dashboard.

Technologies used and licences
------------------------------

The following technologies (with licences listed) are used in this project.

| Technology | Used for | Link | Licence |
| ---------- | -------- | ---- | ------- |
| Bootstrap | To provide the page structure. Currently using version 4 Alpha 6. | [Bootstrap](http://getbootstrap.com/) | [MIT](https://github.com/twbs/bootstrap/blob/master/LICENSE) |
| jQuery | Required by bootstrap and to provide JavaScript code shortcuts | [jQuery](https://jquery.com/) | [MIT](https://jquery.org/license/) |
| DC JS | Dimensional Charting JavaScript library - used for the dynamic charts | [dc.js](https://dc-js.github.io/dc.js/) | [Apache](https://github.com/dc-js/dc.js/blob/develop/LICENSE) |
| Crossfilter | Required by DC JS, provides the cross flitering functionality | [Crossfilter](http://square.github.io/crossfilter/) | [Apache](https://github.com/square/crossfilter/blob/master/LICENSE) |
| D3 | Required by DC JS, provides the data driven graphs | [D3JS](https://d3js.org/) | [BSD](https://github.com/d3/d3/blob/master/LICENSE) |
| Leaflet | JavaScript library for mapping. | [LeafletJS](http://leafletjs.com) | [Open Source](https://github.com/Leaflet/Leaflet/blob/master/LICENSE) |
| CartoJS | Specific functions for mappping using data stored in Carto. | [CartoJS](https://carto.com/docs/carto-engine/carto-js) | [Open Source](https://github.com/CartoDB/cartodb.js/blob/develop/LICENSE) |

Licence
-------

This code is licensed under the MIT Licence.