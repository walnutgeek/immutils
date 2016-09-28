# immutils
Access, modify(copy-on-change) JavaScript objects.

API use plain objects and arrays to store data.
JSON Pointer is used to refer to particular location
in object tree. Rather then mutate object tree, API
recreates branches keeping previous state immutable.

JSON Pointer implemented according RFC-6901 spec with little additon.
In RFC you can use positive number in path to refer particular element
of array, also you can use `-` to indicate new element of array to be
created. This implementation make use of negative numbers to refer
elements from the end of array. Such as `-1` means last element, `-2` -
second from the end, and so forth ...

See:
[RFC 6901 - JavaScript Object Notation (JSON) Pointer - IETF Tools](https://tools.ietf.org/html/rfc6901)
