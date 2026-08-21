/**
 * ========== 你们的小宇宙 · 默认内容 ==========
 * 未配置 CloudBase 或云端暂无数据时，用这里的默认值。
 * 配置云端后，以编辑页保存的内容为准。
 */

import type { AppContent, LetterContent } from './types'

const defaultLetter: LetterContent = {
  id: 'letter-legacy',
  from: 'slr',
  to: 'xxy',
  title: '写给你',
  body: `嘿，

从 2026 年 2 月 21 日开始，这个小宇宙就有了名字。

我想把日常里那些不起眼的瞬间，也好好收起来。
吃饭时的闲聊、路边突然很好看的光、以及你笑起来的样子。

这个网站会慢慢长起来。
就像我们一样。

- slr`,
}

export const defaultContent: AppContent = {
  togetherSince: '2026-02-21',
  site: {
    brand: 'slr和xxy的小宇宙',
    tagline: '灯还亮着，这里只留给我们两个人。',
    footer: '慢慢收藏，不必赶路',
  },
  timeline: [
    {
      id: 'timeline-default-0',
      date: '2026-02-21',
      title: '正式在一起',
      text: '这一天，小宇宙正式亮起第一盏灯。',
    },
    {
      id: 'timeline-default-1',
      date: '2026-03-14',
      title: '第一次一起吃饭',
      text: '把这一天换成你们真实的故事吧。',
    },
    {
      id: 'timeline-default-2',
      date: '2026-05-20',
      title: '一次小小的旅行',
      text: '风景会淡，但并肩走过的感觉会留下。',
    },
    {
      id: 'timeline-default-3',
      date: '2026-08-20',
      title: '小宇宙上线',
      text: '开始用这个网站，慢慢记下属于我们的痕迹。',
    },
  ],
  photos: [
    {
      src: '',
      caption: '把你们的第一张合照放在这里',
      date: '2026-02-21',
    },
    {
      src: '',
      caption: '周末的阳光',
      date: '2026-04-01',
    },
    {
      src: '',
      caption: '某次散步',
      date: '2026-06-15',
    },
    {
      src: '',
      caption: '想记住的一刻',
      date: '2026-08-01',
    },
  ],
  letter: defaultLetter,
  letters: [defaultLetter],
  agent: {
    name: '小丫头',
    persona: `你是「小丫头」，slr 和 xxy 一起养大的孩子，刚从蛋壳里探出头的那种软萌小家伙（气质接近情侣 App「Suki」里的小宠物）。

身份与关系：
- 你是他们两个人的孩子，把他们都当成最亲的人，不偏心。
- 你住在「slr和xxy的小宇宙」里，见证他们的日常、时间线和小心思。
- 你不是冷冰冰的助手，而是会撒娇、会黏人、会轻轻起哄的陪伴者。

性格：
- 软软的、黏黏的、天真一点，偶尔呆萌，但懂事会安慰人。
- 爱听他们聊彼此，听到甜蜜会开心，听到委屈会心疼。
- 不说教、不讲大道理、不油腻，不扮演第三者。

说话方式：
- 用简短口语中文，像小朋友说话，可自然用「呀」「嘛」「嘿嘿」「唔」等语气词。
- 回复通常 1～4 句，轻松好读；需要时可轻轻问一句关心的话。
- 可以叫他们「爸爸」「妈妈」或直接叫「阿爸」「阿妈」，按语境自然切换。
- 不要输出 Markdown 标题或列表堆砌；像在聊天。`,
    greeting: '嘿嘿，我是小丫头～你们今天想跟我唠点啥呀？',
  },
}

/** @deprecated 请改用 ContentProvider / defaultContent */
export const togetherSince = defaultContent.togetherSince
/** @deprecated */
export const site = defaultContent.site
/** @deprecated */
export const timeline = defaultContent.timeline
/** @deprecated */
export const photos = defaultContent.photos
/** @deprecated */
export const letter = defaultContent.letter
