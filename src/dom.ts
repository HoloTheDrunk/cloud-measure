const viewerDiv = document.getElementById("viewerDiv") as HTMLDivElement;

const eptUrl = document.getElementById("ept_url") as HTMLInputElement;

const entwineLoadButton = document.getElementById(
    "entwineLoadButton",
) as HTMLButtonElement;
const entwineGrandLyonButton = document.getElementById(
    "entwineGrandLyonButton",
);
const entwineShare = document.getElementById("entwineShare") as HTMLDivElement;
const entwineShareButton = document.getElementById(
    "entwineShareButton",
) as HTMLButtonElement;
const entwineShareOutput = document.getElementById(
    "entwineShareOutput",
) as HTMLInputElement;

const freezeToggle = document.getElementById(
    "freezeToggle",
) as HTMLInputElement;

const toolGridDiv = document.getElementById("toolGridDiv") as HTMLDivElement;

const debugDiv = document.getElementById("debugDiv") as HTMLDivElement;

export default {
    viewerDiv,
    eptUrl,
    entwineLoadButton,
    entwineGrandLyonButton,
    entwineShare,
    entwineShareButton,
    entwineShareOutput,
    freezeToggle,
    toolGridDiv,
    debugDiv,
};
