## This script takes the newcastle membership csv and attempts
## to reduce the file size as much as possible through aggregation and lookups
## Two lookup files to provide library names and dates are also created.
## Requires Python v3 and pandas (pip install pandas)

import csv
import os
import re
from datetime import datetime
import pandas

def run():

    member_data_frame = pandas.DataFrame(pandas.read_csv(open(os.path.join(os.path.dirname(__file__), '..\\data\\newcastle_members.csv'), 'r')), index=None)

    postcode = member_data_frame['Postcode'].unique()
    library = member_data_frame['Library Registered At'].unique()
    date_added = member_data_frame['Date Added'].unique()
    time_added = member_data_frame['Date Added'].unique()

run()