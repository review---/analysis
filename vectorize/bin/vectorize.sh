#!/usr/bin/env bash
CURDIR=`dirname $0`
source $CURDIR/../../mongo.env

usage (){
cat<<USAGE
Usage :
  idf.sh [options]

Options :
    -h, --help                : This message
    -s, --source      ns      : Target collection ns
    -t, --threshold   float   : IDF threashold minimum proportion (defalut : 0.0)
    -l, --limit       float   : IDF threashold maximum proportion (defalut : 0.40)
    -v, --verb-only           : Pickup verb only
    -j, --jobs        num     : Number of jobs
    -C, --clearjob            : Clear job control info. (Kick once before start parse)
USAGE
  exit $1
}

$CURDIR/tf.sh    -C $@
$CURDIR/tf.sh       $@
$CURDIR/df.sh    -C $@
$CURDIR/df.sh       $@
$CURDIR/idf.sh   -C $@
$CURDIR/idf.sh      $@
$CURDIR/tfidf.sh -C $@
$CURDIR/tfidf.sh    $@




