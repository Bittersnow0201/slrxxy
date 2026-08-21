# CloudBase PostgreSQL 环境配置

你的环境带 PostgreSQL，**不能**改「云存储权限」那个 JSON（会提示不支持修改安全规则）。

正确做法：用 **SQL 编辑器** 建桶 + 开权限。

## 1. 关掉当前弹窗

点「取消」，不要再改 `read/write` JSON。

## 2. 打开 SQL 编辑器

CloudBase 左侧：

**SQL 型数据库 → SQL 编辑器**（或「数据编辑器」旁边的 SQL）

## 3. 第一段：建桶（整段复制执行）

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'slrxxy',
  'slrxxy',
  true,
  20 * 1024 * 1024,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/json']
)
ON CONFLICT (id) DO NOTHING;
```

## 4. 第二段：权限（整段复制执行）

```sql
DROP POLICY IF EXISTS slrxxy_buckets_select ON storage.buckets;
CREATE POLICY slrxxy_buckets_select ON storage.buckets
  FOR SELECT TO anon, authenticated
  USING (id = 'slrxxy');

DROP POLICY IF EXISTS slrxxy_objects_select ON storage.objects;
CREATE POLICY slrxxy_objects_select ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'slrxxy');

DROP POLICY IF EXISTS slrxxy_objects_insert ON storage.objects;
CREATE POLICY slrxxy_objects_insert ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'slrxxy');

DROP POLICY IF EXISTS slrxxy_objects_update ON storage.objects;
CREATE POLICY slrxxy_objects_update ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'slrxxy')
  WITH CHECK (bucket_id = 'slrxxy');

DROP POLICY IF EXISTS slrxxy_objects_delete ON storage.objects;
CREATE POLICY slrxxy_objects_delete ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'slrxxy');
```

执行成功后应没有报错。

## 5. 重新发布网站

```bash
npm run build
```

上传新的 `site.zip` 到 EdgeOne，再试 **保存到云端**。

## 仍需确认

- 匿名登录已开
- 跨域域名含 `slrxxy.cn`、`localhost`
