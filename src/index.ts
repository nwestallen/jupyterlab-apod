import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';

import { Widget } from '@lumino/widgets';

import { Message } from '@lumino/messaging';

// eslint-disable-next-line @typescript-eslint/naming-convention
interface APODResponse {
  copyright: string;
  date: string;
  explanation: string;
  media_type: 'video' | 'image';
  title: string;
  url: string;
}

class APODWidget extends Widget {
  constructor() {
    super();
    this.addClass('my-apodWidget');
    this.img = document.createElement('img');
    this.node.appendChild(this.img);
    this.summary = document.createElement('p');
    this.node.appendChild(this.summary);
  }

  readonly img: HTMLImageElement;
  readonly summary: HTMLParagraphElement;

  async onUpdateRequest(msg: Message): Promise<void> {
    const response = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=YjhJWh8OIy3D8pdWeSdxvhgmfLYAL52xGhD0PMXn&date=${this.randomDate()}`
    );

    if (!response.ok) {
      const data = await response.json();
      if (data.error) {
        this.summary.innerText = data.error.message;
      } else {
        this.summary.innerText = response.statusText;
      }
      return;
    }

    const data = (await response.json()) as APODResponse;

    if (data.media_type === 'image') {
      this.img.src = data.url;
      this.img.title = data.title;
      if (data.copyright) {
        this.summary.innerText = ` (Copyright ${data.copyright})`;
      }
    } else {
      this.summary.innerText = 'Random APOD fetched was not an image.';
    }
  }

  randomDate(): string {
    const start = new Date(2010, 1, 1);
    const end = new Date();
    const randomDate = new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
    return randomDate.toISOString().slice(0, 10);
  }
}

/**
 * Activate the APOD widget extension.
 */
function activate(
  app: JupyterFrontEnd,
  palette: ICommandPalette,
  restorer: ILayoutRestorer | null
) {
  console.log('JupyterLab extension jupyterlab_apod is activated!');

  // Create a single widget
  let widget: MainAreaWidget<APODWidget>;

  // Add an application command
  const command = 'apod:open';
  app.commands.addCommand(command, {
    label: 'Random Astronomy Picture',
    execute: () => {
      if (!widget || widget.isDisposed) {
        const content = new APODWidget();
        widget = new MainAreaWidget({ content });
        widget.id = 'apod-jupyterlab';
        widget.title.label = 'Astronomy Picture';
        widget.title.closable = true;
      }
      if (!tracker.has(widget)) {
        tracker.add(widget);
      }
      if (!widget.isAttached) {
        app.shell.add(widget, 'main');
      }
      widget.content.update();
      app.shell.activateById(widget.id);
    }
  });

  palette.addItem({ command, category: 'Tutorial'});

  const tracker = new WidgetTracker<MainAreaWidget<APODWidget>>({
    namespace: 'apod'
  });
  if (restorer) {
    restorer.restore(tracker, { command, name: () => 'apod' });
  }
}

/**
 * Initialization data for the jupyterlab_apod extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_apod:plugin',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILayoutRestorer],
  activate: activate
};

export default plugin;
