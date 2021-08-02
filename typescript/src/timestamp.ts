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
import {FromObjectValue} from './types';

export interface Timestamp {
  seconds: number; // it's technically Long but we don't want to bring it as a dependency for now
  nanos?: number;
}

export function googleProtobufTimestampToProto3JSON(
  obj: protobuf.Message & Timestamp
) {
  // seconds is an instance of Long so it won't be undefined
  const durationSeconds = obj.seconds;
  const durationMilliseconds =
    typeof obj.nanos === 'number' && obj.nanos > 0
      ? Math.floor(obj.nanos / 1000000)
      : 0;
  return new Date(durationSeconds * 1000 + durationMilliseconds).toISOString();
}

export function googleProtobufTimestampFromProto3JSON(json: string) {
  const match = json.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?/);
  if (!match) {
    throw new Error(
      `googleProtobufDurationFromProto3JSON: incorrect value ${json} passed as google.protobuf.Duration`
    );
  }

  const date = new Date(json);
  const millisecondsSinceEpoch = date.getTime();
  const seconds = Math.floor(millisecondsSinceEpoch / 1000);
  const nanos = (millisecondsSinceEpoch % 1000) * 1000000;

  const result: FromObjectValue = {};
  if (seconds !== 0) {
    result.seconds = seconds;
  }
  if (nanos !== 0) {
    result.nanos = nanos;
  }
  return result;
}
