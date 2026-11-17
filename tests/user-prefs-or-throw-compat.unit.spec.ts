/*!
 * Copyright 2026 WPPConnect Team
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

import { expect, test } from '@playwright/test';
import { readFileSync } from 'fs';
import * as path from 'path';
import { ModuleKind, transpileModule } from 'typescript';
import { runInNewContext } from 'vm';

function loadCondition(): (m: any) => any {
  let condition: ((m: any) => any) | undefined;
  const filename = path.resolve(__dirname, '../src/whatsapp/misc/UserPrefs.ts');
  runInNewContext(
    transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ModuleKind.CommonJS },
    }).outputText,
    {
      exports: {},
      require(id: string) {
        if (id === '../exportModule')
          return {
            exportModule: (_e: any, _n: any, c: (m: any) => any) => {
              condition = c;
            },
          };
        return {};
      },
    }
  );
  if (!condition) throw new Error('UserPrefs condition not captured');
  return condition;
}

const me = { user: '123', server: 'lid' };

test.describe('UserPrefs *OrThrow compatibility', () => {
  test('rebuilds the getters removed by newer WhatsApp versions', () => {
    const m: any = {
      getMaybeMePnUser: () => ({ user: '55', server: 'c.us' }),
      getMaybeMeLidUser: () => me,
      getMaybeMeDeviceLid: () => undefined,
    };
    expect(loadCondition()(m)).toBeTruthy();

    expect(m.getMeLidUserOrThrow()).toBe(me);
    expect(m.getMePnUserOrThrow().user).toBe('55');
    expect(() => m.getMeDeviceLidOrThrow()).toThrow(/getMaybeMeDeviceLid/);
    // no base function -> nothing is invented
    expect(m.getMeDevicePnOrThrow).toBeUndefined();
    expect(m.getMeDisplayNameOrThrow).toBeUndefined();
  });

  test('keeps native getters of older WhatsApp versions untouched', () => {
    const native = () => me;
    const m: any = {
      getMaybeMePnUser: () => ({ user: '55', server: 'c.us' }),
      getMaybeMeLidUser: () => undefined,
      getMeLidUserOrThrow: native,
    };
    loadCondition()(m);
    expect(m.getMeLidUserOrThrow).toBe(native);
  });

  test('legacy module with only getMaybeMeUser is still exported', () => {
    const m: any = { getMaybeMeUser: () => ({ user: '55' }) };
    expect(loadCondition()(m)).toBeTruthy();
    expect(m.getMaybeMePnUser().user).toBe('55');
    expect(m.getMeLidUserOrThrow).toBeUndefined();
  });

  test('unrelated modules are ignored', () => {
    const m: any = { getMaybeMeLidUser: () => me };
    expect(loadCondition()(m)).toBe(false);
    expect(m.getMeLidUserOrThrow).toBeUndefined();
  });
});
