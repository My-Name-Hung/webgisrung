import { XMLParser } from "fast-xml-parser";

export const defaultStyle = {
  fillColor: "#2d5a27",
  weight: 2,
  opacity: 1,
  color: "#2d5a27",
  fillOpacity: 0.7,
};

export const parseSLD = async (sldContent) => {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      parseAttributeValue: true,
      trimValues: true,
      removeNSPrefix: false,
    });

    const result = parser.parse(sldContent);
    console.log("Parsed XML:", JSON.stringify(result, null, 2));

    // Find all rules
    const sld =
      result.StyledLayerDescriptor || result["se:StyledLayerDescriptor"];
    if (!sld) {
      console.error("No StyledLayerDescriptor found in:", result);
      throw new Error("Invalid SLD: Missing StyledLayerDescriptor");
    }

    const rules = findRules(sld);
    if (!rules || rules.length === 0) {
      console.error("No Rules found in:", sld);
      throw new Error("Invalid SLD: Missing Rules");
    }

    console.log("Found Rules:", JSON.stringify(rules, null, 2));

    // Process all rules and their filters
    const styleRules = rules.map((rule) => {
      // Start with default style
      const style = {
        fillColor: "#2d5a27",
        weight: 2,
        opacity: 1,
        color: "#2d5a27",
        fillOpacity: 0.7,
      };

      const polygonSymbolizer =
        rule["se:PolygonSymbolizer"] || rule.PolygonSymbolizer;

      if (polygonSymbolizer) {
        // Process Fill
        const fill = polygonSymbolizer["se:Fill"] || polygonSymbolizer.Fill;
        if (fill) {
          const svgParams =
            fill["se:SvgParameter"] || fill.SvgParameter || fill.CssParameter;
          if (svgParams) {
            const params = Array.isArray(svgParams) ? svgParams : [svgParams];
            params.forEach((param) => {
              const paramName = param["@_name"];
              const paramValue = param["#text"] || param;

              if (paramName === "fill") {
                style.fillColor = normalizeColor(paramValue);
                console.log(
                  `Setting fillColor to: ${style.fillColor} from ${paramValue}`
                );
              } else if (paramName === "fill-opacity") {
                style.fillOpacity = Math.max(
                  0.3,
                  Math.min(1, parseFloat(paramValue))
                );
                console.log(
                  `Setting fillOpacity to: ${style.fillOpacity} from ${paramValue}`
                );
              }
            });
          }
        }

        // Process Stroke
        const stroke =
          polygonSymbolizer["se:Stroke"] || polygonSymbolizer.Stroke;
        if (stroke) {
          const svgParams =
            stroke["se:SvgParameter"] ||
            stroke.SvgParameter ||
            stroke.CssParameter;
          if (svgParams) {
            const params = Array.isArray(svgParams) ? svgParams : [svgParams];
            params.forEach((param) => {
              const paramName = param["@_name"];
              const paramValue = param["#text"] || param;

              if (paramName === "stroke") {
                style.color = normalizeColor(paramValue);
                console.log(
                  `Setting stroke color to: ${style.color} from ${paramValue}`
                );
              } else if (paramName === "stroke-width") {
                style.weight = Math.max(1, parseFloat(paramValue));
                console.log(
                  `Setting stroke width to: ${style.weight} from ${paramValue}`
                );
              } else if (paramName === "stroke-opacity") {
                style.opacity = Math.max(
                  0.5,
                  Math.min(1, parseFloat(paramValue))
                );
                console.log(
                  `Setting stroke opacity to: ${style.opacity} from ${paramValue}`
                );
              }
            });
          }
        }
      }

      // Extract filter
      let filterCondition = null;
      const filter = rule["ogc:Filter"] || rule.Filter;

      if (filter) {
        console.log("Processing filter:", JSON.stringify(filter, null, 2));

        const propertyIsEqualTo =
          filter["ogc:PropertyIsEqualTo"] || filter.PropertyIsEqualTo;
        if (propertyIsEqualTo) {
          // Extract property name
          const extractPropertyName = (prop) => {
            if (prop["ogc:PropertyName"]) {
              return typeof prop["ogc:PropertyName"] === "string"
                ? prop["ogc:PropertyName"]
                : prop["ogc:PropertyName"]["#text"];
            }
            if (prop["PropertyName"]) {
              return typeof prop["PropertyName"] === "string"
                ? prop["PropertyName"]
                : prop["PropertyName"]["#text"];
            }
            return null;
          };

          // Extract literal value
          const extractLiteral = (prop) => {
            if (prop["ogc:Literal"]) {
              return typeof prop["ogc:Literal"] === "string"
                ? prop["ogc:Literal"]
                : prop["ogc:Literal"]["#text"];
            }
            if (prop["Literal"]) {
              return typeof prop["Literal"] === "string"
                ? prop["Literal"]
                : prop["Literal"]["#text"];
            }
            return null;
          };

          const propName = extractPropertyName(propertyIsEqualTo);
          const literalValue = extractLiteral(propertyIsEqualTo);

          console.log("Extracted filter values:", {
            propertyName: propName,
            literal: literalValue,
          });

          if (propName && literalValue) {
            filterCondition = {
              property: propName,
              value: literalValue,
            };
          }
        }
      }

      console.log("Final rule:", {
        filter: filterCondition,
        style: style,
      });

      return {
        style,
        filter: filterCondition,
      };
    });

    console.log("Processed style rules:", JSON.stringify(styleRules, null, 2));
    return styleRules;
  } catch (error) {
    console.error("Error parsing SLD:", error);
    throw new Error(`Invalid SLD format: ${error.message}`);
  }
};

// Helper function to normalize color values
const normalizeColor = (color) => {
  if (!color) return "#2d5a27";

  // Remove any whitespace
  color = color.toString().trim();

  // If it's already a hex color, return as is
  if (color.startsWith("#") && (color.length === 4 || color.length === 7)) {
    return color;
  }

  // If it's a 6-digit hex without #, add it
  if (/^[0-9a-fA-F]{6}$/.test(color)) {
    return `#${color}`;
  }

  // If it's a 3-digit hex without #, add it and expand
  if (/^[0-9a-fA-F]{3}$/.test(color)) {
    const expanded = color
      .split("")
      .map((c) => c + c)
      .join("");
    return `#${expanded}`;
  }

  // Handle RGB values like "rgb(255, 0, 0)"
  const rgbMatch = color.match(
    /rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i
  );
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  // Handle named colors
  const namedColors = {
    red: "#FF0000",
    green: "#008000",
    blue: "#0000FF",
    yellow: "#FFFF00",
    orange: "#FFA500",
    purple: "#800080",
    pink: "#FFC0CB",
    brown: "#A52A2A",
    black: "#000000",
    white: "#FFFFFF",
    gray: "#808080",
    grey: "#808080",
  };

  const normalizedName = color.toLowerCase();
  if (namedColors[normalizedName]) {
    return namedColors[normalizedName];
  }

  console.warn(`Could not normalize color: ${color}, using default`);
  return "#2d5a27";
};

// Helper function to find Rules
const findRules = (sld) => {
  // First try to find NamedLayer
  const namedLayer = sld.NamedLayer;
  if (namedLayer) {
    // Try to find UserStyle
    const userStyle = namedLayer["se:UserStyle"] || namedLayer.UserStyle;
    if (userStyle) {
      // Try to find FeatureTypeStyle
      const featureTypeStyle =
        userStyle["se:FeatureTypeStyle"] || userStyle.FeatureTypeStyle;
      if (featureTypeStyle) {
        // Try to find Rules
        const rules = featureTypeStyle["se:Rule"] || featureTypeStyle.Rule;
        if (rules) {
          return Array.isArray(rules) ? rules : [rules];
        }
      }
    }
  }

  return null;
};

export const applyStyle = (feature, styleRules) => {
  if (
    !feature ||
    !feature.properties ||
    !styleRules ||
    !Array.isArray(styleRules)
  ) {
    console.log("Invalid input to applyStyle:", { feature, styleRules });
    return defaultStyle;
  }

  console.log(
    "Feature properties:",
    JSON.stringify(feature.properties, null, 2)
  );
  console.log(
    "Available style rules:",
    styleRules.map((rule) => ({
      property: rule.filter?.property,
      value: rule.filter?.value,
      style: rule.style,
    }))
  );

  // Find matching rule based on feature properties
  const matchingRule = styleRules.find((rule) => {
    if (!rule.filter) {
      console.log("Rule has no filter:", rule);
      return false;
    }

    const propertyName = rule.filter.property;
    let propertyValue = feature.properties[propertyName];

    // Try common property name variations
    if (propertyValue === undefined) {
      const variations = [
        propertyName,
        propertyName.toLowerCase(),
        propertyName.toUpperCase(),
        propertyName.replace(/\s+/g, "_"),
        propertyName.replace(/\s+/g, ""),
        propertyName.replace(/[_-]/g, " "),
      ];

      for (const variant of variations) {
        if (feature.properties[variant] !== undefined) {
          propertyValue = feature.properties[variant];
          console.log(
            `Found property value using variant "${variant}":`,
            propertyValue
          );
          break;
        }
      }
    }

    if (propertyValue === undefined) {
      console.log("Available properties:", Object.keys(feature.properties));
      console.log("Looking for property:", propertyName);
      console.log("Property not found in feature");
      return false;
    }

    // Case insensitive comparison
    const featureValue = String(propertyValue).toLowerCase().trim();
    const filterValue = String(rule.filter.value).toLowerCase().trim();

    const matches = featureValue === filterValue;
    console.log(
      `Comparing values: "${featureValue}" === "${filterValue}" -> ${matches}`
    );

    return matches;
  });

  if (matchingRule) {
    console.log("Found matching rule:", {
      filter: matchingRule.filter,
      style: matchingRule.style,
    });
    return matchingRule.style;
  }

  console.log("No matching rule found, using default style");
  return defaultStyle;
};
