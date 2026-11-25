const CLIMACTERIC_FRUITS = [
  "apple", "banana", "mango", "avocado", "peach", "papaya", "pear", "kiwi",
  "apricot", "plum", "fig", "guava", "passion fruit", "persimmon", "tomato",
]

export function classifyFruitCategory(
  fruitName: string,
  category?: string
): "climacteric" | "non-climacteric" {
  if (category === "climacteric" || category === "non-climacteric") return category
  const normalizedName = fruitName.toLowerCase()
  return CLIMACTERIC_FRUITS.some((fruit) => normalizedName.includes(fruit))
    ? "climacteric"
    : "non-climacteric"
}
