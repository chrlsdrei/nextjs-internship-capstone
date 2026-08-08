export function labelTextColor(hexColor: string) {
  const red = Number.parseInt(hexColor.slice(1, 3), 16) / 255
  const green = Number.parseInt(hexColor.slice(3, 5), 16) / 255
  const blue = Number.parseInt(hexColor.slice(5, 7), 16) / 255
  const linear = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue)
  const blackContrast = (luminance + 0.05) / 0.05
  const whiteContrast = 1.05 / (luminance + 0.05)
  return blackContrast >= whiteContrast ? "#000000" : "#ffffff"
}

export function labelColorStyle(color: string) {
  return { backgroundColor: color, color: labelTextColor(color) }
}
