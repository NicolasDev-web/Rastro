import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'validate'))
from check_fixture import validate

class FixtureTests(unittest.TestCase):
  def test_no_fake_evidence(self):
    self.assertEqual(validate({'kind':'DEMO_ONLY','warning':'Valores fictícios','records':[{'ibge_code':'2304400','scope':'municipio','authorized':100,'committed':50,'paid':10}]}),[])
  def test_duplicate_detection(self):
    row={'ibge_code':'2304400','scope':'municipio','authorized':100,'committed':50,'paid':10}
    errors=validate({'kind':'DEMO_ONLY','warning':'Valores fictícios','records':[row,row]})
    self.assertTrue(any('Duplicate' in e for e in errors))
  def test_null_not_zero(self):
    row={'ibge_code':'2304400','scope':'municipio','authorized':10,'committed':9}
    errors=validate({'kind':'DEMO_ONLY','warning':'Valores fictícios','records':[row]})
    self.assertIn('Missing paid at 0',errors)

if __name__=='__main__':unittest.main()
