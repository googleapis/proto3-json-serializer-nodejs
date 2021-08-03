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
import {JSONObject, JSONValue, LongStub} from './types';
import {Any, googleProtobufAnyToProto3JSON} from './any';
import {bytesToProto3JSON} from './bytes';
import {getFullyQualifiedTypeName, wrapperTypes} from './util';
import {resolveEnumValueToString} from './enum';
import {
  googleProtobufListValueToProto3JSON,
  googleProtobufStructToProto3JSON,
  googleProtobufValueToProto3JSON,
  ListValue,
  Struct,
  Value,
} from './value';
import {Duration, googleProtobufDurationToProto3JSON} from './duration';
import {googleProtobufTimestampToProto3JSON, Timestamp} from './timestamp';
import {
  BoolValue,
  BytesValue,
  NumberValue,
  StringValue,
  wrapperToProto3JSON,
} from './wrappers';
import {FieldMask, googleProtobufFieldMaskToProto3JSON} from './fieldmask';

const id = (x: JSONValue) => {
  return x;
};

export function toProto3JSON(obj: protobuf.Message): JSONValue {
  const objType = obj.$type;
  if (!objType) {
    throw new Error(
      'Cannot serialize object to proto3 JSON since its .$type is unknown. Use Type.fromObject(obj) before calling toProto3JSON.'
    );
  }

  objType.resolveAll();
  const typeName = getFullyQualifiedTypeName(objType);

  // Types that require special handling according to
  // https://developers.google.com/protocol-buffers/docs/proto3#json
  if (typeName === '.google.protobuf.Any') {
    return googleProtobufAnyToProto3JSON(obj as protobuf.Message & Any);
  }

  if (typeName === '.google.protobuf.Value') {
    return googleProtobufValueToProto3JSON(obj as protobuf.Message & Value);
  }

  if (typeName === '.google.protobuf.Struct') {
    return googleProtobufStructToProto3JSON(obj as protobuf.Message & Struct);
  }

  if (typeName === '.google.protobuf.ListValue') {
    return googleProtobufListValueToProto3JSON(
      obj as protobuf.Message & ListValue
    );
  }

  if (typeName === '.google.protobuf.Duration') {
    return googleProtobufDurationToProto3JSON(
      obj as protobuf.Message & Duration
    );
  }

  if (typeName === '.google.protobuf.Timestamp') {
    return googleProtobufTimestampToProto3JSON(
      obj as protobuf.Message & Timestamp
    );
  }

  if (typeName === '.google.protobuf.FieldMask') {
    return googleProtobufFieldMaskToProto3JSON(
      obj as protobuf.Message & FieldMask
    );
  }

  if (wrapperTypes.has(typeName)) {
    return wrapperToProto3JSON(
      obj as protobuf.Message &
        (NumberValue | StringValue | BoolValue | BytesValue)
    );
  }

  const result: JSONObject = {};
  for (const [key, value] of Object.entries(obj)) {
    const field = objType.fields[key];
    const fieldResolvedType = field.resolvedType;
    const fieldFullyQualifiedTypeName = fieldResolvedType
      ? getFullyQualifiedTypeName(fieldResolvedType)
      : null;
    if (value === null) {
      result[key] = null;
      continue;
    }
    if (Array.isArray(value)) {
      // if the repeated value has a complex type, convert it to proto3 JSON, otherwise use as is
      result[key] = value.map(
        fieldResolvedType
          ? element => {
              return toProto3JSON(element);
            }
          : id
      );
      continue;
    }
    if (field.map) {
      const map: JSONObject = {};
      for (const [mapKey, mapValue] of Object.entries(value)) {
        // if the map value has a complex type, convert it to proto3 JSON, otherwise use as is
        map[mapKey] = fieldResolvedType
          ? toProto3JSON(mapValue as protobuf.Message)
          : (mapValue as JSONValue);
      }
      result[key] = map;
      continue;
    }
    if (fieldFullyQualifiedTypeName === '.google.protobuf.NullValue') {
      result[key] = null;
      continue;
    }
    if (fieldResolvedType && 'values' in fieldResolvedType && value !== null) {
      result[key] = resolveEnumValueToString(fieldResolvedType, value);
      continue;
    }
    if (fieldResolvedType) {
      result[key] = toProto3JSON(value);
      continue;
    }
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      result[key] = value;
      continue;
    }
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
      result[key] = bytesToProto3JSON(value);
      continue;
    }
    // The remaining case is Long, everything else is an internal error
    assert(
      value.constructor.name === 'Long',
      `toProto3JSON: don't know how to convert field ${key} with value ${value}`
    );
    result[key] = (value as LongStub).toNumber();
    continue;
  }
  return result;
}
