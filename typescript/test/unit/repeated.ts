// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as assert from 'assert';
import * as protobuf from 'protobufjs';
import {it} from 'mocha';
import {fromProto3JSON} from '../../src/fromproto3json';
import {toProto3JSON} from '../../src/toproto3json';
import {testTwoTypesOfLoad} from './common';

function testRepeated(root: protobuf.Root) {
  const MessageWithRepeated = root.lookupType('test.MessageWithRepeated');
  const message = MessageWithRepeated.fromObject({
    repeatedString: ['value1', 'value2', 'value3'],
    repeatedMessage: [
      {
        stringField: 'value1',
      },
      {
        stringField: 'value2',
      },
    ],
    oneMoreRepeatedString: [],
  });
  const jsonWithNull = {
    repeatedString: ['value1', 'value2', 'value3'],
    repeatedMessage: [
      {
        stringField: 'value1',
      },
      {
        stringField: 'value2',
      },
    ],
    oneMoreRepeatedString: null,
  };
  const jsonWithEmptyArray = {
    repeatedString: ['value1', 'value2', 'value3'],
    repeatedMessage: [
      {
        stringField: 'value1',
      },
      {
        stringField: 'value2',
      },
    ],
    oneMoreRepeatedString: null,
  };
  const jsonWithoutEmptyArrays = {
    repeatedString: ['value1', 'value2', 'value3'],
    repeatedMessage: [
      {
        stringField: 'value1',
      },
      {
        stringField: 'value2',
      },
    ],
  };

  it('serializes to proto3 JSON', () => {
    const serialized = toProto3JSON(message);
    assert.deepStrictEqual(serialized, jsonWithoutEmptyArrays);
  });

  it('deserializes from proto3 JSON with null', () => {
    const deserialized = fromProto3JSON(MessageWithRepeated, jsonWithNull);
    assert.deepStrictEqual(deserialized, message);
  });

  it('deserializes from proto3 JSON with an empty array', () => {
    const deserialized = fromProto3JSON(
      MessageWithRepeated,
      jsonWithEmptyArray
    );
    assert.deepStrictEqual(deserialized, message);
  });

  it('deserializes from proto3 JSON with an omitted array field', () => {
    const deserialized = fromProto3JSON(
      MessageWithRepeated,
      jsonWithoutEmptyArrays
    );
    assert.deepStrictEqual(deserialized, message);
  });
}

function testEmptyRepeated(root: protobuf.Root) {
  const MessageWithRepeated = root.lookupType('test.MessageWithRepeated');
  const message = MessageWithRepeated.fromObject({
    repeatedString: [],
    repeatedMessage: [],
    oneMoreRepeatedString: [],
  });
  const json = {};

  it('serializes to proto3 JSON', () => {
    const serialized = toProto3JSON(message);
    assert.deepStrictEqual(serialized, json);
  });

  it('deserializes from proto3 JSON', () => {
    const deserialized = fromProto3JSON(MessageWithRepeated, json);
    assert.deepStrictEqual(deserialized, message);
  });
}

testTwoTypesOfLoad('repeated fields', testRepeated);
testTwoTypesOfLoad('empty repeated fields', testEmptyRepeated);
