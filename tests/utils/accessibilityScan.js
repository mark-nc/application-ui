/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

const AAT = require('@ibma/aat')

module.exports = {
  runAccessibilityScan: (browser, page) => {
    browser.source(source => {
      browser.perform((done) => {

        AAT.getCompliance(source.value, page, (report) => {
          browser.assert.equal(report.summary.counts.violation, 0, `Accesibility violations found in page ${browser.launchUrl}/multicloud/${page}   See report at: ./tests-output/a11y/${page}.json`)
          done()
        })
      })
    })
  }
}
