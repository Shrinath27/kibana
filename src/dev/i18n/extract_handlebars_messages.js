/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { formatJSString } from './utils';

const HBS_REGEX = /(?<=\{\{)([\s\S]*?)(?=\}\})/g;
const TOKENS_REGEX = /[^'\s]+|(?:'([^'\\]|\\[\s\S])*')/g;

/**
 * Example: `'{{i18n 'message-id' '{"defaultMessage": "Message text"}'}}'`
 */
export function* extractHandlebarsMessages(buffer) {
  for (const expression of buffer.toString().match(HBS_REGEX) || []) {
    const tokens = expression.match(TOKENS_REGEX);

    const [functionName, idString, propertiesString] = tokens;

    if (functionName !== 'i18n') {
      continue;
    }

    if (tokens.length !== 3) {
      throw new Error('Wrong arguments amount for handlebars i18n call.');
    }

    if (!idString.startsWith(`'`) || !idString.endsWith(`'`)) {
      throw new Error('Message id should be a string literal.');
    }

    const messageId = formatJSString(idString.slice(1, -1));

    if (!propertiesString.startsWith(`'`) || !propertiesString.endsWith(`'`)) {
      throw new Error(
        `Cannot parse "${messageId}" message: properties string should be a string literal.`
      );
    }

    const properties = JSON.parse(propertiesString.slice(1, -1));
    const message = formatJSString(properties.defaultMessage);

    if (typeof message !== 'string') {
      throw new Error(
        `Cannot parse "${messageId}" message: defaultMessage value should be a string.`
      );
    }

    const context = formatJSString(properties.context);

    if (context != null && typeof context !== 'string') {
      throw new Error(`Cannot parse "${messageId}" message: context value should be a string.`);
    }

    yield [messageId, { message, context }];
  }
}
