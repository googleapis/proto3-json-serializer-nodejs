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

// Types that have special JSON representation according to https://developers.google.com/protocol-buffers/docs/proto3#json
// (this set is used for encoding google.protobuf.Any to/from proto3 JSON properly)

import * as protobuf from 'protobufjs';
import {fromProto3JSON} from './fromproto3json';
import {toProto3JSON, ToProto3JSONOptions} from './toproto3json';
import {JSONObject, JSONValue} from './types';

// https://github.com/protocolbuffers/protobuf/blob/ba3836703b4a9e98e474aea2bac8c5b49b6d3b5c/python/google/protobuf/json_format.py#L850
const specialJSON = new Set([
  'google.protobuf.Any',
  'google.protobuf.Duration',
  'google.protobuf.FieldMask',
  'google.protobuf.ListValue',
  'google.protobuf.Struct',
  'google.protobuf.Timestamp',
  'google.protobuf.Value',
]);

export interface Any {
  type_url: string;
  value: Buffer | Uint8Array;
}

export function googleProtobufAnyToProto3JSON(
  obj: protobuf.Message & Any,
  options?: ToProto3JSONOptions,
): JSONObject {
  // https://developers.google.com/protocol-buffers/docs/proto3#json
  // If the Any contains a value that has a special JSON mapping, it will be converted as follows:
  // {"@type": xxx, "value": yyy}.
  // Otherwise, the value will be converted into a JSON object, and the "@type" field will be inserted
  // to indicate the actual data type.

  const typeName = obj.type_url.replace(/^.*\//, '');
  let type: protobuf.Type;
  try {
    type = obj.$type.root.lookupType(typeName);
  } catch (err) {
    throw new Error(
      `googleProtobufAnyToProto3JSON: cannot find type ${typeName}: ${err}`,
    );
  }
  const valueMessage = type.decode(obj.value);
  const valueProto3JSON = toProto3JSON(valueMessage, options);
  if (specialJSON.has(typeName)) {
    return {
      '@type': obj.type_url,
      value: valueProto3JSON,
    };
  }
  (valueProto3JSON as JSONObject)['@type'] = obj.type_url;
  return valueProto3JSON as JSONObject;
}

export function googleProtobufAnyFromProto3JSON(
  root: protobuf.Root,
  json: JSONValue,
) {
  // Not all possible JSON values can hold Any, only real objects.
  if (json === null || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error(
      'googleProtobufAnyFromProto3JSON: must be an object to decode google.protobuf.Any',
    );
  }

  const typeUrl = json['@type'];
  if (!typeUrl || typeof typeUrl !== 'string') {
    throw new Error(
      'googleProtobufAnyFromProto3JSON: JSON serialization of google.protobuf.Any must contain @type field',
    );
  }

  const typeName = typeUrl.replace(/^.*\//, '');
  let type: protobuf.Type;
  try {
    type = root.lookupType(typeName);
  } catch (err) {
    throw new Error(
      `googleProtobufAnyFromProto3JSON: cannot find type ${typeName}: ${err}`,
    );
  }

  let value: JSONValue = json;
  if (specialJSON.has(typeName)) {
    if (!('value' in json)) {
      throw new Error(
        `googleProtobufAnyFromProto3JSON: JSON representation of google.protobuf.Any with type ${typeName} must contain the value field`,
      );
    }
    value = json.value;
  }

  const valueMessage = fromProto3JSON(type, value);
  if (valueMessage === null) {
    return {
      type_url: typeUrl,
      value: null,
    };
  }

  const uint8array = type.encode(valueMessage).finish();
  const buffer = Buffer.from(uint8array, 0, uint8array.byteLength);
  const base64 = buffer.toString('base64');

  return {
    type_url: typeUrl,
    value: base64,
  };
}
