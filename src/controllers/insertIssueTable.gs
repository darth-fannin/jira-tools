// @TODO: dialog insert issues from filter

// @TODO: menu insert issues from filter
// @TODO: callbacks

/* ######## DEV- WIP - Testing #################### */

function tableFromMeta() {
  var _meta = {
    sheetId : "sid_230234225",
    tableId : "tbl_rB2D5",
    name : null,
    rangeA1 : "B2:D5",
    rangeCoord : {
      row : {
        from : 2,
        to : 9
      },
      col : {
        from : 2,
        to : 4
      }
    },
    headerRowOffse : 1,
    headerValues : ["key", "summary", "status"],
    filter : {
      id : 14406,
      name : "01 - Test Project - All Issues",
      jql : "project = TP ORDER BY lastViewed DESC"
    },
    maxResults : 6,
    renderer : "IssueTableRendererDefault_",
    time_lastupdated : 1551636173161
  };

  var table = new IssueTable_({
    metaData : _meta
  });

  var ok = function (resp, status, errorMessage) {
    var renderer;
    table.setIssues(resp.data);

    if (renderer = table.render()) {
      // toast with status message
      var msg = "Finished inserting " + renderer.getInfo().totalInserted + " Jira issues out of " + resp.data.total
          + " total found records.";
      SpreadsheetApp.getActiveSpreadsheet().toast(msg, "Status", 10);
      debug.log(msg);

      console.log('renderer.info: %s', renderer.getInfo());

      console.log('==>> Table Meta: %s', table.getMeta());

      IssueTableIndex_.addTable(table);
    }

    debug.timeEnd('insertIssueTable()');
  };

  var Search = new IssueSearch(table.getMeta('filter').jql);
  Search.setOrderBy()
    .setFields(table.getMeta('headerValues'))
    .setMaxResults(table.getMeta('maxResults'))
    .setStartAt(0)
    .search()
    .withSuccessHandler(ok);

}

function newControllerActionLive() {
  debug.time('insertIssueTable()');

  var ok = function (resp, status, errorMessage) {
    var renderer, attributes = {
      filter : getFilter(14406),
      maxResults : resp.data.maxResults,
      issues : resp.data,
      sheet : getTicketSheet(),
      renderer : IssueTableRendererDefault_
    };

    var table = new IssueTable_(attributes);
    if (renderer = table.render()) {
      // toast with status message
      var msg = "Finished inserting " + renderer.getInfo().totalInserted + " Jira issues out of " + resp.data.total
          + " total found records.";
      SpreadsheetApp.getActiveSpreadsheet().toast(msg, "Status", 10);
      debug.log(msg);

      console.log('renderer.info: %s', renderer.getInfo());

      console.log('==>> Table Meta: %s', table.getMeta());
    }

    debug.timeEnd('insertIssueTable()');
  };

  var Search = new IssueSearch("status = Done");
  Search.setOrderBy().setFields(['key', 'summary', 'status']).setMaxResults(11).setStartAt(0).search().withSuccessHandler(ok);
}

function testTable1() {
  console.log('testTable1()');

  SpreadsheetTriggers_.register('onEdit', 'onEditTableMeta', true);
  SpreadsheetTriggers_.register('onChange', 'onEditTableMeta', true);
}

function onEditTableMeta(e) {
  console.log('onEditTableMeta(): %s', e);

  // check against if current sheet has any monitored IssueTable (loop)
  if (getTicketSheet().getSheetId() != TestTable.sheetId) {
    console.log('not monitored sheet, leave...');
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rangeCheck = ss.getRangeByName(TestTable.rangeName);
  // get range left/top corner
  var rangeCoord = {
    'c' : rangeCheck.getColumn(),
    'r' : rangeCheck.getRow()
  };

  // EDIT, INSERT_ROW, INSERT_COLUMN, REMOVE_ROW, REMOVE_COLUMN, INSERT_GRID,
  // REMOVE_GRID, FORMAT, or OTHER
  switch (e.changeType) {
    case 'EDIT': // cell values changed; currently same validation rules as rest

    case 'REMOVE_GRID':
    case 'INSERT_GRID':
    case 'REMOVE_COLUMN':
    case 'REMOVE_ROW':
    case 'INSERT_COLUMN':
    case 'INSERT_ROW':
      // get issue table header (always in 2nd row)
      var tableHeader = getTicketSheet().getRange(rangeCoord.r + TestTable.headerRowOffset, rangeCoord.c, 1,
          (rangeCheck.getLastColumn() - rangeCoord.c + 1));
      // header changed?
      if (tableHeader.getValues()[0].join('|') !== TestTable.headerValues.join('|')) {
        console.log('Compare header: %s !== %s', tableHeader.getValues()[0].join('|'), TestTable.headerValues.join('|'));
        console.log('New header values: %s', tableHeader.getValues());

        /*
         * @TODO: logic needed to check new header values - parse and check if new value is a supported Jira field - yes: update meta - no:
         * flag column to be skipped - header moved inside table range (relative offset update?) / not 2nd row anymore? allowed at all?
         */

        // update meta - changed header
        TestTable.headerValues = tableHeader.getValues();

      } else {
        console.log('table header didnt change, skip...');
      }

      // check for structural changes and update table meta OR throw warning
      // (refresh wont be possible after such change)
      if (rangeCheck.getA1Notation() === TestTable.rangeA1) {
        console.log('Range dimension didnt change, skip...');
        // return; // nothing to do
      } else {
        console.log('! Range changed !');

        /*
         * !! check if new change is affecting IssueTable functionality If YES: prompt user with warning and undo or accept with IssueTable
         * beeing converted to static sheet table (remove trigger) If NO: simply update TableMeta if necessary
         */
        // update meta - changed dimension/range
        TestTable.rangeA1 = rangeCheck.getA1Notation();

        console.log('New Tables Range: %s', TestTable.rangeA1);
      }

      break;

    default:
      return;
      break;
  }

}

function testTriggerDialog() {
  console.log('testTriggerDialog()');

  SpreadsheetTriggers_.register('onEdit', 'onEditOpenDialog', true);
  SpreadsheetTriggers_.register('onChange', 'onEditOpenDialog', true);
}

function onEditOpenDialog(e) {
  debug.log('onEditOpenDialog()');
  dialogAbout();

  debug.log('END<!--');
}