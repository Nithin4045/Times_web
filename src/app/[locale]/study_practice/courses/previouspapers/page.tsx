'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { SetBreadcrumb } from '@/app/[locale]/study_practice/BreadcrumbContext';

export default function PapersAndAnalysisPage() {
  const [activeTab, setActiveTab] = useState<'papers' | 'analysis'>('papers');

  return (
    <main className={styles.container}>
      <SetBreadcrumb text="Previous Papers & Test Analysis" />

      {/* Top pill-style selector */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'papers' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('papers')}
        >
          Previous Papers
        </button>

        <Link
          href="http://36.50.3.204:3000/test-analysis/1"
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.tabBtn} ${activeTab === 'analysis' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Test Analysis
        </Link>
      </div>

      <div className={styles.contentArea}>
        {activeTab === 'papers' && (
          <section className={styles.htmlSection}>
            <table className={`${styles.table} ${styles.tableBordered}`}>
              <thead>
                <tr className={styles.tHead}>
                  <th className={styles.col25}>CAT Papers</th>
                  <th className={styles.col25}>SNAP Papers</th>
                  <th className={styles.col25}>XAT Papers</th>
                  <th className={styles.col25}>IIFT Papers</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className={styles.tLeftR}>
                    <a href="https://www.time4education.com/catoldpapers/test1999.asp" target="_blank" rel="noopener noreferrer">CAT 1999</a>
                  </td>
                  <td className={styles.tCR}>
                    <a href="https://www.time4education.com/originalometpapers/snap2008.asp" target="_blank" rel="noopener noreferrer">SNAP 2008</a>
                  </td>
                  <td className={styles.tLeftR}>
                    <a href="https://www.time4education.com/originalometpapers/Xat2008.asp" target="_blank" rel="noopener noreferrer">XAT 2008</a>
                  </td>
                  <td className={styles.tCR}>
                    <a href="https://www.time4education.com/originalometpapers/test2006.asp" target="_blank" rel="noopener noreferrer">IIFT 2006</a>
                  </td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/catoldpapers/test2000.asp" target="_blank" rel="noopener noreferrer">CAT 2000</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/originalometpapers/snap2009.asp" target="_blank" rel="noopener noreferrer">SNAP 2009</a></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/originalometpapers/Xat2009.asp" target="_blank" rel="noopener noreferrer">XAT 2009</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/originalometpapers/test2007.asp" target="_blank" rel="noopener noreferrer">IIFT 2007</a></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/catoldpapers/test2001.asp" target="_blank" rel="noopener noreferrer">CAT 2001</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/originalometpapers/snap2010.asp" target="_blank" rel="noopener noreferrer">SNAP 2010</a></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/originalometpapers/Xat2010.asp" target="_blank" rel="noopener noreferrer">XAT 2010</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/originalometpapers/test2008.asp" target="_blank" rel="noopener noreferrer">IIFT 2008</a></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/catoldpapers/test.asp" target="_blank" rel="noopener noreferrer">CAT 2002</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/originalometpapers/snap2011.asp" target="_blank" rel="noopener noreferrer">SNAP 2011</a></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/originalometpapers/Xat2011.asp" target="_blank" rel="noopener noreferrer">XAT 2011</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/originalometpapers/test2009.asp" target="_blank" rel="noopener noreferrer">IIFT 2009</a></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/catoldpapers/test2003.asp" target="_blank" rel="noopener noreferrer">CAT 2003</a></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/originalometpapers/Xat2012.asp" target="_blank" rel="noopener noreferrer">XAT 2012</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/originalometpapers/test2010.asp" target="_blank" rel="noopener noreferrer">IIFT 2010</a></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/catoldpapers/test2004.asp" target="_blank" rel="noopener noreferrer">CAT 2004</a></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/XATpages/xat13_analysis.asp" target="_blank" rel="noopener noreferrer">XAT 2013</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/originalometpapers/test2011.asp" target="_blank" rel="noopener noreferrer">IIFT 2011</a></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/catoldpapers/test2005.asp" target="_blank" rel="noopener noreferrer">CAT 2005</a></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/originalometpapers/forprint_XAT13.asp" target="_blank" rel="noopener noreferrer"><b>XAT 2013 Print</b></a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/originalometpapers/test2012.asp" target="_blank" rel="noopener noreferrer">IIFT 2012</a></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/catoldpapers/test2006.asp" target="_blank" rel="noopener noreferrer">CAT 2006</a></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}>
                    <a href="https://www.time4education.com/originalometpapers/forprint_XAT13.asp" target="_blank" rel="noopener noreferrer"><b>XAT 2013-Part 2-Part A</b></a>,&nbsp;
                    <a href="https://www.time4education.com/originalometpapers/Xat2013_b.asp" target="_blank" rel="noopener noreferrer"><b>XAT 2013-Part 2-Part B</b></a>
                  </td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/originalometpapers/test2013.asp" target="_blank" rel="noopener noreferrer">IIFT 2013</a></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/catoldpapers/test2007.asp" target="_blank" rel="noopener noreferrer">CAT 2007</a></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/pdf.js-gh-pages/web/viewer.php?file=e-books/xatsolutions/XAT2014SolutionsASeries.pdf" target="_blank" rel="noopener noreferrer">XAT 2014</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/originalometpapers/forprint_IIFT13.asp" target="_blank" rel="noopener noreferrer"><b>IIFT 2013 Print</b></a></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/catoldpapers/test2008.asp" target="_blank" rel="noopener noreferrer">CAT 2008</a></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/pdf.js-gh-pages/web/viewer.php?file=e-books/xatsolutions/XAT2015Solutions.pdf" target="_blank" rel="noopener noreferrer">XAT 2015</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/CAT-MBA/IIFT-2014-Solutions/IIFT-2014-Solutions.asp" target="_blank" rel="noopener noreferrer">IIFT 2014</a></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/local/articlecms/page.php?id=1277" target="_blank" rel="noopener noreferrer">CAT 2017</a></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/pdf.js-gh-pages/web/viewer.php?file=e-books/xatsolutions/XAT2016-20160103-A-Series-paper-solutions.pdf" target="_blank" rel="noopener noreferrer">XAT 2016</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/CAT-MBA/iift-2015-solutions/iift-2015-solutions.asp" target="_blank" rel="noopener noreferrer">IIFT 2015</a></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/local/articlecms/page.php?id=3527" target="_blank" rel="noopener noreferrer">CAT 2018</a></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/pdf.js-gh-pages/web/viewer.php?file=e-books/xatsolutions/XAT2017-20170108-D-Series-paper-solutions.pdf" target="_blank" rel="noopener noreferrer">XAT 2017</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/pdf.js-gh-pages/web/viewer.php?file=e-books/iiftsolutions/IIFT2016-20161127-C-Series-paper-solutions.pdf" target="_blank" rel="noopener noreferrer">IIFT 2016</a></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/local/articlecms/page.php?id=3934" target="_blank" rel="noopener noreferrer">CAT 2019</a></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/XATpages/Xat2018-solutions.asp" target="_blank" rel="noopener noreferrer">XAT 2018</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/pdf.js-gh-pages/web/viewer.php?file=e-books/iiftsolutions/IIFT2017-03122017-Set-D-paper-and-solutions.pdf" target="_blank" rel="noopener noreferrer">IIFT 2017</a></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/local/articlecms/page.php?id=5000" target="_blank" rel="noopener noreferrer">CAT 2020</a></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/pdf.js-gh-pages/web/viewer.php?file=e-books/xatsolutions/XAT2019_Held on 20190106.pdf" target="_blank" rel="noopener noreferrer">XAT 2019</a></td>
                  <td className={styles.tCR}><a href="https://www.time4education.com/pdf.js-gh-pages/web/viewer.php?file=e-books/iiftsolutions/IIFT2018-Paper-SETD-Held-on-20181202.pdf" target="_blank" rel="noopener noreferrer">IIFT 2018</a></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/local/articlecms/page.php?id=6365" target="_blank" rel="noopener noreferrer">CAT 2021</a></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/pdf.js-gh-pages/web/viewer.php?file=e-books/xatsolutions/XAT2020_Held on 20200105.pdf" target="_blank" rel="noopener noreferrer">XAT 2020</a></td>
                  <td className={styles.tCR}></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/local/articlecms/page.php?id=7489" target="_blank" rel="noopener noreferrer">CAT 2022</a></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/pdf.js-gh-pages/web/viewerapp.php?file=e-books/xatsolutions/XAT2021_Solutions_Held on 20210103.pdf" target="_blank" rel="noopener noreferrer">XAT 2021</a></td>
                  <td className={styles.tCR}></td>
                </tr>

                <tr>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/local/articlecms/page.php?id=7673" target="_blank" rel="noopener noreferrer">CAT 2023</a></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/local/articlecms/page.php?id=7674" target="_blank" rel="noopener noreferrer">XAT 2022</a></td>
                  <td className={styles.tCR}></td>
                </tr>

                <tr>
                  <td className={styles.tCR}></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/local/articlecms/page.php?id=7675" target="_blank" rel="noopener noreferrer">XAT 2023</a></td>
                  <td className={styles.tCR}></td>
                </tr>

                <tr>
                  <td className={styles.tCR}></td>
                  <td className={styles.tCR}></td>
                  <td className={styles.tLeftR}><a href="https://www.time4education.com/local/articlecms/page.php?id=7676" target="_blank" rel="noopener noreferrer">XAT 2024</a></td>
                  <td className={styles.tCR}></td>
                </tr>

              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}
