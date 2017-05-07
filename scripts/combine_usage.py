## This script takes the usage CSV files,and combines them to produce a single monthly usage file
## Requires Python v3

import csv
import os
import pandas

def run():

	edf = pandas.DataFrame(pandas.read_csv(open(os.path.join(os.path.dirname(__file__), '..\\data\\enquiries.csv'), 'r')), index=None)
	enquiries = pandas.melt(edf, id_vars=['Library'], var_name='month', value_name='enquiries')
	
	idf = pandas.DataFrame(pandas.read_csv(open(os.path.join(os.path.dirname(__file__), '..\\data\\issues.csv'), 'r')), index=None)
	issues = pandas.melt(idf, id_vars=['Library'], var_name='month', value_name='issues')
	
	vdf = pandas.DataFrame(pandas.read_csv(open(os.path.join(os.path.dirname(__file__), '..\\data\\visits.csv'), 'r')), index=None)
	visits = pandas.melt(vdf, id_vars=['Library'], var_name='month', value_name='visits')

	pcdf = pandas.DataFrame(pandas.read_csv(open(os.path.join(os.path.dirname(__file__), '..\\data\\computers.csv'), 'r')), index=None)
	computers = pandas.melt(pcdf, id_vars=['Library'], var_name='month', value_name='sessions')

	usage = enquiries.merge(visits).merge(issues).merge(computers)
	usage.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_usage.csv'), index=False, float_format='%.0f')

run()