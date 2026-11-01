import React from "react";
import { Composition, Folder } from "remotion";
import { VIDEO } from "./brand/theme";
import { Colours } from "./compositions/Colours";
import { FailReasons } from "./compositions/FailReasons";
import { HowManyLeft } from "./compositions/HowManyLeft";
import { PassByArea } from "./compositions/PassByArea";
import { PassByModel } from "./compositions/PassByModel";
import { Registrations } from "./compositions/Registrations";
import { SeasonDue } from "./compositions/SeasonDue";
import { Theft } from "./compositions/Theft";
import { UsedPriceTrend } from "./compositions/UsedPriceTrend";
import { ValueTable } from "./compositions/ValueTable";
import { WorthAfter } from "./compositions/WorthAfter";
import { WrongTurn } from "./compositions/WrongTurn";
import { pickColours, pickHowManyLeft, pickRegistrations, pickTheft, pickWrongTurn } from "./pickers/brand";
import { pickFailReasons, pickPassByArea, pickPassByModel, pickSeasonDue } from "./pickers/mot";
import { pickUsedPriceTrend, pickValueTable, pickWorthAfter } from "./pickers/sellers";
import type { AnyProps, CompositionId } from "./props";

/**
 * One Composition per template. In Studio each shows its first-occurrence
 * props; the renderer (src/cli/render.ts) passes the week's real props as
 * inputProps. Variants are plain props, so they can be switched in Studio.
 */
const COMPONENTS: Record<CompositionId, React.FC<never>> = {
  Theft: Theft as React.FC<never>,
  HowManyLeft: HowManyLeft as React.FC<never>,
  Colours: Colours as React.FC<never>,
  Registrations: Registrations as React.FC<never>,
  WrongTurn: WrongTurn as React.FC<never>,
  ValueTable: ValueTable as React.FC<never>,
  WorthAfter: WorthAfter as React.FC<never>,
  UsedPriceTrend: UsedPriceTrend as React.FC<never>,
  FailReasons: FailReasons as React.FC<never>,
  PassByArea: PassByArea as React.FC<never>,
  PassByModel: PassByModel as React.FC<never>,
  SeasonDue: SeasonDue as React.FC<never>,
};

const DEFAULTS: Array<{ folder: string; id: CompositionId; props: AnyProps }> = [
  { folder: "Brand", id: "Theft", props: pickTheft(0, 0, true).props },
  { folder: "Brand", id: "HowManyLeft", props: pickHowManyLeft(0, 0, true).props },
  { folder: "Brand", id: "Colours", props: pickColours(0, 0, true).props },
  { folder: "Brand", id: "Registrations", props: pickRegistrations(0, 0, true).props },
  { folder: "Brand", id: "WrongTurn", props: pickWrongTurn(0, 0, true).props },
  { folder: "Sellers", id: "ValueTable", props: pickValueTable(0, 0, true).props },
  { folder: "Sellers", id: "WorthAfter", props: pickWorthAfter(0, 0, true).props },
  { folder: "Sellers", id: "UsedPriceTrend", props: pickUsedPriceTrend(0, 0, true).props },
  { folder: "MOT", id: "FailReasons", props: pickFailReasons(0, 0, true).props },
  { folder: "MOT", id: "PassByArea", props: pickPassByArea(0, 0, true).props },
  { folder: "MOT", id: "PassByModel", props: pickPassByModel(0, 0, true).props },
  { folder: "MOT", id: "SeasonDue", props: pickSeasonDue(2, 0, true).props },
];

export const Root: React.FC = () => {
  const folders = [...new Set(DEFAULTS.map((d) => d.folder))];
  return (
    <>
      {folders.map((folder) => (
        <Folder key={folder} name={folder}>
          {DEFAULTS.filter((d) => d.folder === folder).map((d) => (
            <Composition
              key={d.id}
              id={d.id}
              component={COMPONENTS[d.id]}
              durationInFrames={VIDEO.frames}
              fps={VIDEO.fps}
              width={VIDEO.width}
              height={VIDEO.height}
              defaultProps={d.props as never}
            />
          ))}
        </Folder>
      ))}
    </>
  );
};
