export default function findSvg(root: ParentNode): SVGElement {
  const svg = root.querySelector('svg');
  if (svg === null) throw new Error('No svg element was rendered.');

  return svg;
}
