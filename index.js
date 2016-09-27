function unescape (s) {
  var new_s = null;
  for( var i = 0 ; i < s.length ; i++ ){
    var ch = s[i];
    if( '~' === ch ){
      if( new_s === null) {
        new_s = s.substr(0, i);
      }
      ch = s[++i];
      if( ch === '0' ){
        new_s += '~';
      }else if( ch === '1' ){
        new_s += '/';
      }else{
        throw new Error('Invalid escape: ~' + ch)
      }
    }else if(new_s !== null ){
      new_s += s[i];
    }
  }
  return new_s != null ? new_s : s ;
}

function escape (s) {
  var new_s = null;
  for( var i = 0 ; i < s.length ; i++ ){
    var ch = s[i];
    if( '~' === ch || '/' === ch ){
      if( new_s === null) {
        new_s = s.substr(0, i);
      }
      new_s += ( ch === '~' ) ? '~0' : '~1';
    }else if(new_s !== null ){
      new_s += s[i];
    }
  }
  return new_s !== null ? new_s : s ;
}

function isDigit(ch) {
  return ch != null && ch >= '0' && ch <= '9';
}

function isArrayLike(elem) {
  if(!elem) return false;
  if(elem === '-') return true;
  for ( var i = 0 ; i < elem.length ; i++){
    var ch = elem[i];
    if(ch === '-' && i === 0 )
      continue;
    if(!isDigit(ch)){
      return false;
    }
  }
  return true;
}


function cloneObject(source) {
  var output = {};
  for (var nextKey in source) {
    if (source.hasOwnProperty(nextKey)) {
      output[nextKey] = source[nextKey];
    }
  }
  return output;
}

function isPlainObj(o) {
  return o !== null && typeof o == 'object' && o.constructor == Object;
}

function clone(obj){
  if(Array.isArray(obj)){
    return obj.slice(0);
  }else if( isPlainObj(obj) ){
    return cloneObject(obj);
  }else{
    return obj;
  }
}

function extract_array_key(elem,obj){
  if( Array.isArray(obj) ){
    if(elem === '-'){
      var len = obj.length;
      return len;
    }else{
      var p = +elem;
      if (p >= 0){
        return p;
      }else{
        return len+p;
      }
    }
  }else{
    return elem;
  }
}

function identity(v){
  return v;
}

function JsonPointer (p) {
  if (typeof p === 'string') {
    this.path = p.split('/').map(unescape);
  } else if (Array.isArray(p)) {
    this.path = p;
  }else{
    throw new Error('Dont know how to construct JSON pointer from:' + p);
  }
  if (this.path[0] !== '') {
    throw new Error('JSON pointer has to start with "/"');
  }
  this.root = this.path.length === 2 && this.path[1] === '';
  this.arraysLike = [];
  this.keyGens = [];
  var self = this;
  this.path.forEach(function(elem, i){
    var arrayLike = isArrayLike(elem);
    self.arraysLike[i] = arrayLike;
    self.keyGens[i] = arrayLike ? extract_array_key : identity;
  });
}

JsonPointer.prototype._key = function (i, obj){
  return this.keyGens[i](this.path[i], obj);
};

JsonPointer.prototype._search_obj = function (obj, stack){
  for (var i = 1, len = this.path.length; i < len; i++) {
    var p = this._key(i,obj);
    if(obj.hasOwnProperty(p)){
      obj = obj[p];
      if(stack != null) {
        stack.push(obj);
      }
    }else{
      return undefined;
    }
  }
  return obj;
};

JsonPointer.prototype.get = function (obj) {
  if( this.root ){
    return obj;
  }
  return this._search_obj(obj,undefined);
};

JsonPointer.prototype.remove = function (obj) {
  if( this.root  || obj == null){
    return undefined;
  }
  var stack = [obj];
  this._search_obj(obj, stack);
  var len = this.path.length;
  if( stack.length === len ) {
    stack.pop();
    var clones = stack.map(clone);
    for (var i = 0 ; i < (clones.length - 1) ; i++) {
      var k = this._key(i+1, clones[i]) ;
      clones[i][k] = clones[i+1];
    }
    var last = clones[i];
    var k = this._key(i+1,last);
    if(Array.isArray(last)) {
      last.splice(k, 1);
    }else{
      delete last[k];
    }
    return clones[0];
  }
  return obj;
};

JsonPointer.prototype.set = function (obj, value) {
  if( this.root ){
    return value;
  }
  var clones = [];
  if( obj != null ){
    var stack = [obj]
    this._search_obj(obj, stack);
    clones = stack.map(clone);
  }
  var len = this.path.length;
  while( clones.length < len-1 ) {
    clone.push(this.arraysLike[i + 1] ? [] : {});
  }
  if(clones.length == len) {
    clones.pop();
  }
  for (var i = 0 ; i < (clones.length - 1) ; i++) {
    var k = this._key(i+1, clones[i]) ;
    clones[i][k] = clones[i+1];
  }
  var last = clones[i];
  var k = this._key(i+1,last);
  last[k] = value;
  return clones[0];
}


function fn_name(f) {
  var m = f.toString().match(/^\s*function\s*([^\s(]+)/);
  return m ? m[1] : "";
}

function obj_zip(vals,keys) {
  var obj = {};
  var get_key = keys;
  if(Array.isArray(keys)){
    get_key = function(v,i){ return keys[i]; };
  }
  vals.forEach( function(v,i){ obj[get_key(v,i)] = v;} );
  return obj;
}

module.exports = obj_zip([
    JsonPointer
],fn_name);

module.exports.private = obj_zip([
  isDigit,
  isArrayLike,
  escape,
  unescape,
  cloneObject,
  clone
], fn_name);