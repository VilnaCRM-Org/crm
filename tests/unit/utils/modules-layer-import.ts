const COMMENT = String.raw`(?:\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/|\/\/[^\n]*(?:\n|$))`;
const GAP = String.raw`\s*(?:${COMMENT}\s*)*`;

const modulesLayerImport = new RegExp(
  String.raw`(?:\bfrom|\bimport)${GAP}(?:\(${GAP})?['"](?:@\/modules|@auth)`,
  'u'
);

export default modulesLayerImport;
