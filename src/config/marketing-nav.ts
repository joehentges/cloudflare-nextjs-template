type Link = {
  label: string
  href: string
}

interface MarketingNav {
  nav: Link[]
  footer: {
    right: Link[]
  }
}

export const marketingNav: MarketingNav = {
  nav: [
    {
      label: "Home",
      href: "/home"
    },
    {
      label: "My Learning",
      href: "/my-learning"
    },
    {
      label: "Catalog",
      href: "/catalog"
    },
    {
      label: "Favorites",
      href: "/favorites"
    }
  ],
  footer: {
    right: [
      {
        label: "Marketing",
        href: "/"
      },
      {
        label: "Blog",
        href: "/blog"
      }
    ]
  }
}
