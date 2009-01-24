(function() {
  var TEXTAREA = 'textarea.pageContent';
  var doc = null;
  
  var load_css = function() {
    var css = doc.createElement('style');
    css.type = 'text/css';
    css.innerHTML = 'textarea { overflow: scroll; } '
    doc.getElementsByTagName('head')[0].appendChild(css);    
  }
  
  var is_table_row = function(line) {
    return line.indexOf('|') == 0;
  }
  
  var split_row = function(line) {
    var parts = $.trim(line).split('|');
    parts = parts.slice(1, parts.length - 1);
    
    for(var i = 0, j = parts.length; i < j; i++) {
      parts[i] = $.trim(parts[i]);
    }

    return parts;
  }
  
  var right_pad = function(value, length) {
    var padded = value;
    
    for(var i = 0, j = length - value.length; i < j; i++) {
      padded += " ";
    }

    return padded;
  }
  
  var get_max_column_widths_of = function(table) {
    widths = [];
    
    $.each(table, function() {
      var parts = split_row(this);
      
      $.each(parts, function(index, value) {
        if(widths.length <= index) {
          widths.push(value.length)
        }
        else if(value.length > widths[index]) {
          widths[index] = value.length;
        }
      });
    });
    
    return widths;
  }
  
  var format_table = function(table) {
    var formatted = "";
    var widths = get_max_column_widths_of(table);

    $.each(table, function() {
      formatted += "| ";
      var parts = split_row(this);
      
      $.each(parts, function(index, value) {
        formatted += right_pad(value, widths[index]) + " | ";
      });
      
      formatted += "\n";
    });
    
    return formatted;
  }
  
  var format_content = function(content) {
    var formatted = "";
    var current_table = [];
    var current_number_of_columns = 0;
    var lines = content.split("\n");
    
    $.each(lines, function(){
      if(is_table_row(this)) {
        var number_of_columns = split_row(this).length
        
        if(current_table.length == 0 || current_number_of_columns == number_of_columns) {
          current_table.push(this);
          current_number_of_columns = number_of_columns;
          return true;
        }
      }
      
      formatted += format_table(current_table);
      current_table = [];
      
      if(is_table_row(this)) {
        current_table.push(this);
        current_number_of_columns = split_row(this).length;
      }
      else {
        formatted += this + "\n";
      }
    });
    
    formatted += format_table(current_table);
    return formatted.slice(0, formatted.length - 1);
  }
  
  var format_page = function() {
    var textarea = $(TEXTAREA, doc);
    textarea.attr('value', format_content(textarea.attr('value')));
  }
  
  var content_load = function(event) {
    doc = event.target.defaultView.document;
    load_css();
    var textarea = $(TEXTAREA, doc);
    
    if(textarea.length) {
      var editButtons = $("div.edit_buttons", doc)
      editButtons.append('<input id="format_button" type="button" accesskey="f" value="Format">');
      $('#format_button', doc).click(format_page);
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
