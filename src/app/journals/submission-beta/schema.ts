
import { z } from 'zod'

export const SmartSubmissionSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  description: z.string().min(1, "摘要不能为空"),
  type: z.enum(["NOVEL", "PAPER"]),
  category: z.string().min(1, "学科分类不能为空"),
  journalId: z.string().min(1, "必须选择一个期刊"),
  tempFilePath: z.string().min(1, "文件丢失，请重新上传"),
  authors: z.array(z.object({
    name: z.string().min(1, "姓名不能为空"),
    unit: z.string().optional(),
    isCorresponding: z.boolean().default(false),
    contact: z.string().optional() // Required if corresponding
  })).min(1, "至少需要一位作者")
}).refine(data => {
  // Check if at least one corresponding author exists
  const hasCorresponding = data.authors.some(a => a.isCorresponding)
  return hasCorresponding
}, {
  message: "请至少指定一位通讯作者",
  path: ["authors"]
}).refine(data => {
  // Check if corresponding author has contact
  const valid = data.authors.every(a => !a.isCorresponding || (a.contact && a.contact.length > 0))
  return valid
}, {
  message: "通讯作者必须填写联系方式",
  path: ["authors"]
})

export type SmartSubmissionData = z.infer<typeof SmartSubmissionSchema>
