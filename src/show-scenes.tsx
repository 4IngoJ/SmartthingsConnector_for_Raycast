import { List, showToast, Toast, ActionPanel, Action } from "@raycast/api";
import { useEffect, useState } from "react";
import { fetchScenes, executeScene } from "./lib/smartthings";
import { Scene } from "./types";

export default function ShowScenes() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadScenes() {
      try {
        const scenesData = await fetchScenes();
        setScenes(scenesData);
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch scenes",
          message: (error as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadScenes();
  }, []);

  const handleExecuteScene = async (sceneId: string) => {
    try {
      await executeScene(sceneId);
      showToast({ style: Toast.Style.Success, title: "Scene executed successfully" });
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error executing scene",
        message: (error as Error).message,
      });
    }
  };

  const formatDate = (timestamp: string | undefined) => {
    if (!timestamp) return "Never executed";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search Scenes...">
      {scenes.map((scene) => (
        <List.Item
          key={scene.sceneId}
          title={scene.sceneName || "Unnamed Scene"}
          accessories={[{ text: `Last executed: ${formatDate(scene.lastExecutedDate)}` }]}
          actions={
            <ActionPanel>
              <Action title="Execute Scene" onAction={() => handleExecuteScene(scene.sceneId)} />
            </ActionPanel>
          }
        />
      ))}
      {scenes.length === 0 && !isLoading && (
        <List.Item
          title="No Scenes Found"
          accessories={[{ text: "No scenes available for this location." }]}
        />
      )}
    </List>
  );
}
