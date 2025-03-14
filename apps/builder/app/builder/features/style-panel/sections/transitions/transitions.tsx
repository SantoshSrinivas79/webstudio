import { useStore } from "@nanostores/react";
import { PlusIcon } from "@webstudio-is/icons";
import {
  SectionTitle,
  SectionTitleButton,
  Tooltip,
} from "@webstudio-is/design-system";
import { propertiesData } from "@webstudio-is/css-data";
import {
  toValue,
  type CssProperty,
  type LayerValueItem,
} from "@webstudio-is/css-engine";
import {
  CollapsibleSectionRoot,
  useOpenState,
} from "~/builder/shared/collapsible-section";
import { $selectedOrLastStyleSourceSelector } from "~/shared/nano-states";
import { humanizeString } from "~/shared/string-utils";
import { repeatUntil } from "~/shared/array-utils";
import type { ComputedStyleDecl } from "~/shared/style-object-model";
import { getDots } from "../../shared/style-section";
import {
  addRepeatedStyleItem,
  RepeatedStyle,
} from "../../shared/repeated-style";
import { PropertySectionLabel } from "../../property-label";
import { useComputedStyles } from "../../shared/model";
import { TransitionContent } from "./transition-content";
import { parseCssFragment } from "../../shared/css-fragment";

const transitionLongHandProperties = [
  "transition-property",
  "transition-timing-function",
  "transition-delay",
  "transition-duration",
  "transition-behavior",
] as const satisfies CssProperty[];

export { transitionLongHandProperties as properties };

const label = "Transitions";

const getTransitionLayers = (
  styles: ComputedStyleDecl[],
  property: (typeof transitionLongHandProperties)[number]
) => {
  const transitionPropertyValue = styles[0].cascadedValue;
  const currentPropertyValue = styles.find(
    (styleDecl) => styleDecl.property === property
  )?.cascadedValue;
  const transitionPropertiesCount =
    transitionPropertyValue.type === "layers"
      ? transitionPropertyValue.value.length
      : 0;
  const definedLayers: LayerValueItem[] =
    currentPropertyValue?.type === "layers"
      ? currentPropertyValue.value
      : [propertiesData[property].initial as LayerValueItem];
  return repeatUntil(definedLayers, transitionPropertiesCount);
};

const getLayerLabel = ({
  styles,
  index,
}: {
  styles: ComputedStyleDecl[];
  index: number;
}) => {
  // show label without hidden replacement
  const propertyLayer = getTransitionLayers(styles, "transition-property")[
    index
  ];
  const property = humanizeString(toValue({ ...propertyLayer, hidden: false }));
  const duration = toValue(
    getTransitionLayers(styles, "transition-duration")[index]
  );
  const timingFunctionLayer = getTransitionLayers(
    styles,
    "transition-timing-function"
  )[index];
  const timingFunction = toValue({ ...timingFunctionLayer, hidden: false });
  const delay = toValue(getTransitionLayers(styles, "transition-delay")[index]);
  return `${property}: ${duration} ${timingFunction} ${delay}`;
};

export const Section = () => {
  const [isOpen, setIsOpen] = useOpenState(label);

  const selectedOrLastStyleSourceSelector = useStore(
    $selectedOrLastStyleSourceSelector
  );

  const isStyleInLocalState =
    selectedOrLastStyleSourceSelector &&
    selectedOrLastStyleSourceSelector.state === undefined;
  const styles = useComputedStyles(transitionLongHandProperties);
  const dots = getDots(styles);

  return (
    <CollapsibleSectionRoot
      fullWidth
      label={label}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <SectionTitle
          inactive={dots.length === 0}
          collapsible={dots.length !== 0}
          dots={dots}
          suffix={
            <Tooltip
              content={
                isStyleInLocalState === false
                  ? "Transitions can only be added in local state"
                  : "Add a transition"
              }
            >
              <SectionTitleButton
                disabled={isStyleInLocalState === false}
                prefix={<PlusIcon />}
                onClick={() => {
                  setIsOpen(true);
                  addRepeatedStyleItem(
                    styles,
                    parseCssFragment("opacity 200ms ease 0ms normal", [
                      "transition",
                    ])
                  );
                }}
              />
            </Tooltip>
          }
        >
          <PropertySectionLabel
            label={label}
            description="Animate the transition between states on this instance."
            properties={transitionLongHandProperties}
          />
        </SectionTitle>
      }
    >
      <RepeatedStyle
        label={label}
        styles={styles}
        getItemProps={(index) => ({
          label: getLayerLabel({ styles, index }),
        })}
        renderItemContent={(index) => <TransitionContent index={index} />}
      />
    </CollapsibleSectionRoot>
  );
};
