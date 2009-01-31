(function() {
  var TEXTAREA = 'textarea.pageContent';
  var doc = null;
  
  var load_css = function() {
    var css = doc.createElement('style');
    css.type = 'text/css';
    css.innerHTML = 
      'textarea.no_wrap { overflow: scroll; } ' +
      'div.edit_buttons { float: left; }' +
      'div.edit_options { float: right; }' +
      'div.hints { clear: both; }'
    doc.getElementsByTagName('head')[0].appendChild(css);    
  }

  var format_content = function(wikiText) {
    var formatted = "";
    var currentTable = [];
    var lines = wikiText.split("\n");
    var line = null;

    for(var i = 0, j = lines.length; i < j; i++) {
      line = lines[i];

      if(is_table_row(line)) {
        currentTable.push(line);
      }
      else {
        formatted += format_table(currentTable);
        currentTable = [];        
        formatted += line + "\n";
      }
    }

    formatted += format_table(currentTable);
    return formatted.slice(0, formatted.length - 1);
  }

  var format_table = function(table) {
    var formatted = "";
    var rows = split_rows(table);
    var widths = calculate_column_widths(rows);
    var row = null;

    for(var rowIndex = 0, numberOfRows = rows.length; rowIndex < numberOfRows; rowIndex++) {
      row = rows[rowIndex];
      formatted += "|";

      for(var columnIndex = 0, numberOfColumns = row.length; columnIndex < numberOfColumns; columnIndex++) {
        formatted += right_pad(row[columnIndex], widths[rowIndex][columnIndex]) + "|";
      }

      formatted += "\n";
    }

    return formatted;
  }

  var calculate_column_widths = function(rows) {
    var widths = get_real_column_widths(rows);
    var totalNumberOfColumns = get_number_of_columns(rows);

    var maxWidths = get_max_widths(widths, totalNumberOfColumns);    
    set_max_widths_on_non_colspan_columns(widths, maxWidths);

    var colspanWidths = get_colspan_width(widths, totalNumberOfColumns);
    adjust_widths_for_colspans(widths, maxWidths, colspanWidths);

    adjust_colspans_for_widths(widths, maxWidths);

    return widths;
  }

  var is_table_row = function(line) {
    return line.indexOf('|') == 0;
  }

  split_rows = function(rows) {
    var split_rows = [];

    each(rows, function(row) {
      split_rows.push(split_row(row));
    }, this);

    return split_rows;
  }

  var split_row = function(row) {
    var columns = trim(row).split('|');
    columns = columns.slice(1, columns.length - 1);

    each(columns, function(column, i) {
      columns[i] = trim(column);
    }, this);

    return columns;
  }

  var get_real_column_widths = function(rows) {
    var widths = [];

    each(rows, function(row, rowIndex) {
      widths.push([]);

      each(row, function(column, columnIndex) {
        widths[rowIndex][columnIndex] = column.length;
      }, this);
    }, this);

    return widths;
  }

  var get_max_widths = function(widths, totalNumberOfColumns) {
    var maxWidths = [];
    var row = null;

    each(widths, function(row, rowIndex) {
      each(row, function(columnWidth, columnIndex) {
        if(columnIndex == (row.length - 1) && row.length < totalNumberOfColumns) {
          return false;
        }

        if(columnIndex >= maxWidths.length) {
          maxWidths.push(columnWidth);
        }
        else if(columnWidth > maxWidths[columnIndex]) {
          maxWidths[columnIndex] = columnWidth;
        }        
      }, this);
    }, this);

    return maxWidths;
  }

  var get_number_of_columns = function(rows) {
    var numberOfColumns = 0;

    each(rows, function(row) {
      if(row.length > numberOfColumns) {
        numberOfColumns = row.length;
      }
    });

    return numberOfColumns;
  }

  var get_colspan_width = function(widths, totalNumberOfColumns) {
    var colspanWidths = [];
    var colspan = null;
    var colspanWidth = null;

    each(widths, function(row, rowIndex) {
      if(row.length < totalNumberOfColumns) {
        colspan = totalNumberOfColumns - row.length;
        colspanWidth = row[row.length - 1];

        if(colspan >= colspanWidths.length) {
          colspanWidths[colspan] = colspanWidth;
        }
        else if(!colspanWidths[colspan] || colspanWidth > colspanWidths[colspan]) {
          colspanWidths[colspan] = colspanWidth;
        }
      }
    });

    return colspanWidths;
  }

  var set_max_widths_on_non_colspan_columns = function(widths, maxWidths) {
    each(widths, function(row, rowIndex) {
      each(row, function(columnWidth, columnIndex) {
        if(columnIndex == (row.length - 1) && row.length < maxWidths.length) {
          return false;
        }

        row[columnIndex] = maxWidths[columnIndex];
      }, this);
    }, this);
  }

  var get_width_of_last_number_of_columns = function(maxWidths, numberOfColumns) {
    var width = 0;

    for(var i = 1; i <= numberOfColumns; i++) {
      width += maxWidths[maxWidths.length - i]
    }

    return width + numberOfColumns - 1; //add in length of separators
  }

  var spread_out_excess_over_last_number_of_columns = function(maxWidths, excess, numberOfColumns){
    var columnToApplyExcessTo = maxWidths.length - numberOfColumns;

    for(var i = 0; i < excess; i++) {
      maxWidths[columnToApplyExcessTo++] += 1;

      if(columnToApplyExcessTo == maxWidths.length) {
        columnToApplyExcessTo = maxWidths.length - numberOfColumns;
      }
    }
  }

  var adjust_widths_for_colspans = function(widths, maxWidths, colspanWidths) {
    var lastNumberOfColumnsWidth = null;
    var excess = null;

    each(colspanWidths, function(colspanWidth, index) {
      lastNumberOfColumnsWidth = get_width_of_last_number_of_columns(maxWidths, index + 1);

      if(colspanWidth && colspanWidth > lastNumberOfColumnsWidth){
        excess = colspanWidth - lastNumberOfColumnsWidth;
        spread_out_excess_over_last_number_of_columns(maxWidths, excess, index + 1);
        set_max_widths_on_non_colspan_columns(widths, maxWidths);
      }
    }, this);
  }

  var adjust_colspans_for_widths = function(widths, maxWidths) {
    var colspan = null;
    var lastNumberOfColumnsWidth = null

    each(widths, function(row, rowIndex) {
      colspan = maxWidths.length - row.length + 1;

      if(colspan > 1) {
        row[row.length - 1] = get_width_of_last_number_of_columns(maxWidths, colspan);
      }      
    }, this);
  }

  /*
   * Utility functions
   */
  var trim = function(text) {
    return (text || "").replace( /^\s+|\s+$/g, "" );
  }

  var each = function(array, callback, context) {
    var index = 0;
    var length = array.length;

    while(index < length && callback.call(context, array[index], index) !== false) {
      index++;
    }
  }

  var right_pad = function(value, length) {
    var padded = value;

    for(var i = 0, j = length - value.length; i < j; i++) {
      padded += " ";
    }

    return padded;
  }

  var format_page = function() {
    var textarea = $(TEXTAREA, doc);
    textarea.attr('value', format_content(textarea.attr('value')));
  }
  
  var toggle_wrap = function() {
    var textarea = $(TEXTAREA, doc);
    textarea.attr('wrap', this.checked ? 'soft' : 'off');

    if(this.checked) {
      textarea.removeClass('no_wrap');
    }
    else {
      textarea.addClass('no_wrap');
    }
  }
  
  var content_load = function(event) {
    doc = event.target.defaultView.document;
    load_css();
    var textarea = $(TEXTAREA, doc);
    
    if(textarea.length) {
      var editButtons = $("div.edit_buttons", doc)
      editButtons.append('<input id="format_button" type="button" accesskey="f" value="Format">');
      $('#format_button', doc).click(format_page);
      
      editButtons.after('<div class="edit_options"><input id="toggle_wrap" type="checkbox" accesskey="w" checked="checked" title="Turns on/off wrapping"><span>wrap</span></div>')
      $('#toggle_wrap', doc).click(toggle_wrap);
      
      textarea.attr('wrap', 'soft');
    }
  }
  
  var on_load = function() {
    var	appcontent=window.document.getElementById("appcontent");
  	
  	if(appcontent) {
  		appcontent.addEventListener("DOMContentLoaded", content_load, false);
  	}
  }
  
  window.addEventListener('load', on_load, false);
})();
