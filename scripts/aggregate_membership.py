## This script takes the newcastle membership csv and attempts
## to reduce the file size as much as possible through aggregation and lookups
## Two lookup files to provide library names and dates are also created.
## Requires Python v3 and pandas (pip install pandas)

import csv
import os
import re
from datetime import datetime
import pandas

MEMBERDATA = '..\\data\\newcastle_members.csv'

def read_member_data():
    member_data_frame = pandas.DataFrame(
        pandas.read_csv(open(os.path.join(os.path.dirname(__file__), MEMBERDATA), 'r')), index=None)
    return member_data_frame

def run():
    
    members = read_member_data()
    
    postcode = members['Postcode'].unique()
    library = members['Library Registered At'].unique()
    date_added = members['Date Added'].unique()
    time_added = members['Date Added'].unique()

run()