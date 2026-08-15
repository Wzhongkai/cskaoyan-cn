/*
 * 卡片外观配置。
 *
 * 院校名称、链接和介绍放在 sites.md；卡片的图片、变体和排版放在这里。
 * 新增院校时只需要在 profiles 中增加一个同名配置，未配置的院校会使用
 * defaults，不会影响其他卡片。
 */
export const siteCardConfig = {
  defaults: {
    variant: "standard",
    linkLabel: "访问站点",
    theme: {
      color: "#6750a4",
      aura: "#eaddff",
    },
  },

  profiles: {
    信工所: {
      variant: "institute-featured",
      image: {
        src: "images/iie-cover-v2.jpg",
        position: "center 12%",
      },
      theme: {
        color: "#6750a4",
        aura: "#eaddff",
      },
      identity: {
        code: "CAS · IIE",
        subtitle: "院所专题 / 2026",
      },
      titleParts: [
        { className: "institute-title-academy", text: "中国科学院" },
        { className: "institute-title-name", text: "信息工程研究所" },
        {
          className: "institute-title-english",
          text: "INSTITUTE OF INFORMATION ENGINEERING",
        },
      ],
      linkLabel: "进入专题",
    },

    软件所: {
      variant: "cover",
      image: {
        src: "images/iscas-cover.jpg",
        position: "center 10%",
      },
      theme: {
        color: "#386a20",
        aura: "#b7f397",
      },
    },

    沈计所: {
      variant: "title-only",
      image: {
        src: "images/sict-campus-cover-v5.jpg",
        position: "center",
      },
      theme: {
        color: "#785900",
        aura: "#ffdf9e",
      },
      titleParts: [
        { className: "title-academy", text: "中国科学院" },
        { className: "title-institution", text: "沈阳计算技术研究所" },
        { className: "title-guide", text: "报考指南" },
      ],
    },

    华大: {
      theme: {
        color: "#6750a4",
        aura: "#eaddff",
      },
    },

    杭高院: {
      image: {
        src: "images/hias-cover.png",
      },
      theme: {
        color: "#386a20",
        aura: "#b7f397",
      },
    },
  },
};
