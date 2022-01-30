/*!
 * Copyright 2021 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Wid } from '../../whatsapp';
import { sendSetGroupSubject } from '../../whatsapp/functions';
import { ensureGroup } from './';

/**
 * Define the group subject
 *
 * @example
 * ```javascript
 * await WPP.group.setSubject('<group-id>@g.us', 'new group subject');
 * ```
 *
 * @category Group
 */
export async function setSubject(groupId: string | Wid, subject: string) {
  const groupChat = ensureGroup(groupId, true);

  await sendSetGroupSubject(groupChat.id, subject);

  groupChat.name = subject;
  groupChat.formattedTitle = subject;

  return true;
}
