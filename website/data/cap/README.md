# Introduction

This folder contains some experiments with creating an AVRO schema for [Common Alerting Protocol](http://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html), a.k.a. CAP, messages (any message would do, but I have chosen CAP as it is a relatively simple message).

## Initial tests

I've tested the created [schema](http://avro.apache.org/docs/current/spec.html) using the [avro-tools](http://apache.mirror.triple-it.nl/avro/avro-1.8.2/js/avro-js-1.8.2.tgz).

```console
java -jar avro-tools-1.8.2.jar compile schema cap.avsc tmp
```

## Further work

I want to parse the xml CAP messages in the example folder using the JavaScript library [avsc](https://github.com/mtth/avsc).

## Remarks

I was not fully able to map every element exactly. For example, the xs:dateTime is represented using a regular expression pattern ("\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d[-,+]\d\d:\d\d", but I could only use a string type.

Also, in XML, you can define xs:anyURI, and I've chosen to represent it as a string type too. Potentially, we could use [LogicalType](https://avro.apache.org/docs/current/api/java/org/apache/avro/LogicalType.html) to represent them (see also [here](https://github.com/mtth/avsc/wiki/Advanced-usage#logical-types).

In addition, CAP messages contain an any element, and I have no idea how to include that.
