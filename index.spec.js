var immutils = require('.');

describe("private", function() {
  var private = immutils.private;
  it("unescape", function () {
    var unescape = private.unescape;
    expect(unescape('abc~0xyz')).toBe('abc~xyz');
    expect(unescape('abc~1xyz')).toBe('abc/xyz');
    expect(unescape('abc~1xy~0z')).toBe('abc/xy~z');
    expect(unescape('abcxyz')).toBe('abcxyz');
    expect(function(){unescape('ab~2cxyz')})
        .toThrow(new Error('Invalid escape: ~2'));
  });
  it("escape", function () {
    var escape = private.escape;
    expect(escape('abc~xyz')).toBe('abc~0xyz');
    expect(escape('abc/xyz')).toBe('abc~1xyz');
    expect(escape('abc/xy~z')).toBe('abc~1xy~0z');
    expect(escape('abcxyz')).toBe('abcxyz');
  });
  it("isDigit", function () {
    var isDigit = private.isDigit ;
    [ '0','1','2','3',4,'5','6','7',8, '9'].forEach(
        function (d) {
          expect(isDigit(d)).toBe(true);
        }
    );
    [ 'a','z','',undefined,null].forEach(
        function (d) {
          expect(isDigit(d)).toBe(false);
        }
    );
  });
  it("isArrayLike", function () {
    var isArrayLike = private.isArrayLike ;
    [ '0','12','-','375',8,'-5',-3].forEach(
        function (d) {
          expect(isArrayLike(d)).toBe(true);
        }
    );
    [ 'a' ,''  ,'3-5' ,'--' ,undefined ,null ].forEach(
        function (d) {
          expect(isArrayLike(d)).toBe(false);
        }
    );
  });
  it('clone',function (){
    function checkClone(a) {
      var a_ = private.clone(a);
      expect(a === a_).toBe(false);
      expect(a).toEqual(a_);
    }
    checkClone({ a : 5, x: 3} );
    checkClone([ 'a' , 5, 'x', 3] );

  });
});

describe("JsonPointer", function() {
  function jp(p) {
    return new immutils.JsonPointer(p);
  }
  var str = JSON.stringify;
  it("constructor error", function() {
    expect(function(){ jp('s/1')})
        .toThrow(new Error('JSON pointer has to start with "/"'));

  });

  it("constructor unknown type", function() {
    expect(function(){ jp(1)})
        .toThrow(new Error('Dont know how to construct JSON pointer from:1'));

  });

  it("constructor", function() {
    var jsonPointer = jp('/s/1');
    expect(jsonPointer.path[0]).toBe('');
    expect(jsonPointer.path[1]).toBe('s');
    expect(jsonPointer.path[2]).toBe('1');
  });

  it("constructor array", function() {
    expect(function(){ jp(['s' ,'1'])})
        .toThrow(new Error('JSON pointer has to start with "/"'));
    var jsonPointer = jp(['', 's' ,'1']);
    expect(jsonPointer.path[0]).toBe('');
    expect(jsonPointer.path[1]).toBe('s');
    expect(jsonPointer.path[2]).toBe('1');
  });

  it("get", function() {
    var v = {a: 4, s: [1,0] };
    expect(jp('/s/1').get(v)).toBe(0);
    expect(jp('/s/0').get(v)).toBe(1);
    expect(jp('/a').get(v)).toBe(4);
    expect(jp('/s').get(v)).toEqual([1,0]);
    expect(jp('/d').get(v)).toBe(undefined);
    expect(jp('/').get(v)).toBe(v);
  });

  it("remove", function() {
    var v = {a: 4, s: [1,0] ,x : {z:5,y:{q: undefined}}};
    var s = str(v);
    var next = jp('/s/5').remove(v);
    expect(next).toBe(v);
    next = jp('/s/1').remove(v);
    expect(undefined).toBe(jp('/').remove(v));
    expect(next!==v).toBe(true);
    expect(str(v)).toBe(s);
    expect(str(next)).toBe('{"a":4,"s":[1],"x":{"z":5,"y":{}}}')
    expect(str(jp('/x/z').remove(next))).toBe('{"a":4,"s":[1],"x":{"y":{}}}')
  });
  it("set", function() {
    var v = {a: 4, s: [1,0] ,x : {z:5,y:{q: undefined}}};
    var s = str(v);
    var next = jp('/s/5').set(v,'x');
    expect(next!==v).toBe(true);
    expect(str(v)).toBe(s);
    expect(str(next)).toBe('{"a":4,"s":[1,0,null,null,null,"x"],"x":{"z":5,"y":{}}}');
    expect(0).toBe(jp('/s/1').get(next));
    expect(0).toBe(jp('/s/-1').get(v));
    expect('x').toBe(jp('/s/-1').get(next));
    expect('ha').toBe(jp('/').set(v,'ha'));
    next = jp('/s/x').set(next,'q');
    expect(next!==v).toBe(true);
    expect(str(v)).toBe(s);
    expect(str(next)).toBe('{"a":4,"s":{"0":1,"1":0,"5":"x","x":"q"},"x":{"z":5,"y":{}}}');
    expect(0).toBe(jp('/s/1').get(next));
    next = jp('/q/p/r/s/t').set(next,'q');
    expect(str(next)).toBe('{"a":4,"s":{"0":1,"1":0,"5":"x","x":"q"},"x":{"z":5,"y":{}},"q":{"p":{"r":{"s":{"t":"q"}}}}}');
    next = jp('/q/p2/-/s/t').set(next,'q');
    expect(str(next)).toBe('{"a":4,"s":{"0":1,"1":0,"5":"x","x":"q"},"x":{"z":5,"y":{}},"q":{"p":{"r":{"s":{"t":"q"}}},"p2":[{"s":{"t":"q"}}]}}' );
    next = jp('/q/p2/-/s/t').set(next,'q');
    expect(str(next)).toBe('{"a":4,"s":{"0":1,"1":0,"5":"x","x":"q"},"x":{"z":5,"y":{}},"q":{"p":{"r":{"s":{"t":"q"}}},"p2":[{"s":{"t":"q"}},{"s":{"t":"q"}}]}}');
    next = jp('/a').set(next,'q');
    expect(str(next)).toBe('{"a":"q","s":{"0":1,"1":0,"5":"x","x":"q"},"x":{"z":5,"y":{}},"q":{"p":{"r":{"s":{"t":"q"}}},"p2":[{"s":{"t":"q"}},{"s":{"t":"q"}}]}}');
  });

  it("toString", function() {
    ['/', '/a','/a/5','/x/3/x','/x~0/3/x~1','/~0','/~1'].forEach(function(s){
      expect(s).toBe(jp(s).toString());
    });
  });
  it("walk", function() {
    var dfwalk = [];
    var obj = {a:3,x:{q:[3,{z:0}]}};
    immutils.walk(obj,function(jp,v){
      dfwalk.push(jp.toString());
      dfwalk.push(v);
    });
    //on_anynode
    expect(dfwalk).toEqual([
      '/', { a : 3, x : { q : [ 3, { z : 0 } ] } },
      '/a', 3,
      '/x', { q : [ 3, { z : 0 } ] },
      '/x/q', [ 3, { z : 0 } ],
      '/x/q/0', 3,
      '/x/q/1', { z : 0 },
      '/x/q/1/z', 0 ]);
    dfwalk = [];
    immutils.walk(obj,function(jp,v){
      if( jp.path.length > 2 ){
        return false;
      }
      dfwalk.push(jp.toString());
      dfwalk.push(v);
    });
    //on_anynode
    expect(dfwalk).toEqual([
      '/', { a : 3, x : { q : [ 3, { z : 0 } ] } },
      '/a', 3,
      '/x', { q : [ 3, { z : 0 } ] }, ]);
    dfwalk = [];
    //on_leaf
    immutils.walk(obj, undefined, function(jp,v){
      dfwalk.push(jp.toString());
      dfwalk.push(v);
    });
    expect(dfwalk).toEqual([
      '/a', 3,
      '/x/q/0', 3,
      '/x/q/1/z', 0 ]);
  });
  it("sibling-parent-child", function() {
    var obj = {a:3,x:{q:[3,{z:0}]}};
    var a = jp('/x').sibling('a');
    expect(a.get(obj)).toBe(3);
    var root = a.parent() ;
    expect(root.toString()).toBe('/');
    expect(function(){root.parent()})
        .toThrow(new Error("Root pointer can't have parent"));
    expect(function(){root.sibling('x')})
        .toThrow(new Error("Root pointer cannot have siblings n=x"));
    a = root.child('a') ;
    expect(a.get(obj)).toBe(3);
    var x_q = jp('/x/q/z').parent();
    expect(x_q.toString()).toBe('/x/q');
    expect(x_q.get(obj)).toEqual( [ 3, { z : 0 } ] );
    x_q = jp('/x').child('q');
    expect(x_q.toString()).toBe('/x/q');


  });

});

