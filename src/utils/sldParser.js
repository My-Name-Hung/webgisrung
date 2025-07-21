import { parseString } from "xml2js";

const defaultStyle = {
  fillColor: "#2d5a27",
  weight: 2,
  opacity: 1,
  color: "#2d5a27",
  fillOpacity: 0.3,
};

export const parseSLD = async (sldContent) => {
  return new Promise((resolve, reject) => {
    parseString(sldContent, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const style = {};
        const sld = result.StyledLayerDescriptor;
        const namedLayer = sld.NamedLayer[0];
        const userStyle = namedLayer.UserStyle[0];
        const featureTypeStyle = userStyle.FeatureTypeStyle[0];
        const rule = featureTypeStyle.Rule[0];

        // Parse PolygonSymbolizer
        if (rule.PolygonSymbolizer) {
          const polygonSymbolizer = rule.PolygonSymbolizer[0];
          if (polygonSymbolizer.Fill) {
            const fill = polygonSymbolizer.Fill[0];
            if (fill.CssParameter) {
              fill.CssParameter.forEach((param) => {
                if (param.$.name === "fill") {
                  style.fillColor = param._;
                } else if (param.$.name === "fill-opacity") {
                  style.fillOpacity = parseFloat(param._);
                }
              });
            }
          }
          if (polygonSymbolizer.Stroke) {
            const stroke = polygonSymbolizer.Stroke[0];
            if (stroke.CssParameter) {
              stroke.CssParameter.forEach((param) => {
                if (param.$.name === "stroke") {
                  style.color = param._;
                } else if (param.$.name === "stroke-width") {
                  style.weight = parseFloat(param._);
                } else if (param.$.name === "stroke-opacity") {
                  style.opacity = parseFloat(param._);
                }
              });
            }
          }
        }

        // Parse LineSymbolizer
        if (rule.LineSymbolizer) {
          const lineSymbolizer = rule.LineSymbolizer[0];
          if (lineSymbolizer.Stroke) {
            const stroke = lineSymbolizer.Stroke[0];
            if (stroke.CssParameter) {
              stroke.CssParameter.forEach((param) => {
                if (param.$.name === "stroke") {
                  style.color = param._;
                } else if (param.$.name === "stroke-width") {
                  style.weight = parseFloat(param._);
                } else if (param.$.name === "stroke-opacity") {
                  style.opacity = parseFloat(param._);
                }
              });
            }
          }
        }

        // Parse PointSymbolizer
        if (rule.PointSymbolizer) {
          const pointSymbolizer = rule.PointSymbolizer[0];
          if (pointSymbolizer.Graphic) {
            const graphic = pointSymbolizer.Graphic[0];
            if (graphic.Mark) {
              const mark = graphic.Mark[0];
              if (mark.Fill) {
                const fill = mark.Fill[0];
                if (fill.CssParameter) {
                  fill.CssParameter.forEach((param) => {
                    if (param.$.name === "fill") {
                      style.fillColor = param._;
                    } else if (param.$.name === "fill-opacity") {
                      style.fillOpacity = parseFloat(param._);
                    }
                  });
                }
              }
            }
            if (graphic.Size) {
              style.radius = parseFloat(graphic.Size[0]);
            }
          }
        }

        resolve({ ...defaultStyle, ...style });
      } catch (error) {
        reject(error);
      }
    });
  });
};

export const applyStyle = (feature, style) => {
  const type = feature.geometry.type;

  switch (type) {
    case "Point":
    case "MultiPoint":
      return {
        radius: style.radius || 8,
        fillColor: style.fillColor,
        color: style.color,
        weight: style.weight,
        opacity: style.opacity,
        fillOpacity: style.fillOpacity,
      };

    case "LineString":
    case "MultiLineString":
      return {
        color: style.color,
        weight: style.weight,
        opacity: style.opacity,
      };

    case "Polygon":
    case "MultiPolygon":
      return {
        fillColor: style.fillColor,
        fillOpacity: style.fillOpacity,
        color: style.color,
        weight: style.weight,
        opacity: style.opacity,
      };

    default:
      return defaultStyle;
  }
};
