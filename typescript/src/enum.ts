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

import * as protobuf from 'protobufjs';
import {JSONValue} from './types';

export function resolveEnumValueToString(
  enumType: protobuf.Enum,
  enumValue: JSONValue
) {
  if (typeof enumValue === 'number') {
    const value = enumType.valuesById[enumValue];
    if (typeof value === 'undefined') {
      throw new Error(`enumFromProto3JSON: unknown value id ${enumValue}`);
    }
    return value;
  }
  if (typeof enumValue === 'string') {
    const id = enumType.values[enumValue];
    if (typeof id === 'undefined') {
      throw new Error(`enumFromProto3JSON: unknown value ${enumValue}`);
    }
    return enumValue;
  }
  throw new Error(
    'resolveEnumValueToString: enum value must be a string or a number'
  );
}
