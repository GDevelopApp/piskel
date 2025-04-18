(function () {
  var ns = $.namespace('pskl.controller');

  var PRIMARY_COLOR_CLASSNAME = 'palettes-list-primary-color';
  var SECONDARY_COLOR_CLASSNAME = 'palettes-list-secondary-color';
  var CYCLED_COLOR_CLASSNAME = 'palettes-list-cycled-color';

  ns.PalettesListController = function (usedColorService) {
    this.usedColorService = usedColorService;
    this.paletteService = pskl.app.paletteService;
  };

  ns.PalettesListController.prototype.init = function () {
    this.paletteColorTemplate_ = pskl.utils.Template.get('palette-color-template');

    this.colorListContainer_ = document.querySelector('.palettes-list-colors');
    this.colorPaletteSelect_ = document.querySelector('.palettes-list-select');

    var createPaletteButton_ = document.querySelector('.create-palette-button');
    var editPaletteButton_ = document.querySelector('.edit-palette-button');

    this.colorPaletteSelect_.addEventListener('change', this.onPaletteSelected_.bind(this));
    this.colorListContainer_.addEventListener('mouseup', this.onColorContainerMouseup.bind(this));
    this.colorListContainer_.addEventListener('contextmenu', this.onColorContainerContextMenu.bind(this));

    createPaletteButton_.addEventListener('click', this.onCreatePaletteClick_.bind(this));
    editPaletteButton_.addEventListener('click', this.onEditPaletteClick_.bind(this));

    $.subscribe(Events.PALETTE_LIST_UPDATED, this.onPaletteListUpdated.bind(this));
    $.subscribe(Events.CURRENT_COLORS_UPDATED, this.fillColorListContainer.bind(this));
    $.subscribe(Events.PRIMARY_COLOR_SELECTED, this.highlightSelectedColors.bind(this));
    $.subscribe(Events.SECONDARY_COLOR_SELECTED, this.highlightSelectedColors.bind(this));
    $.subscribe(Events.USER_SETTINGS_CHANGED, this.onUserSettingsChange_.bind(this));
    $.subscribe(Events.TOOL_SELECTED, this.onToolEvent_.bind(this));

    var shortcuts = pskl.service.keyboard.Shortcuts;
    pskl.app.shortcutService.registerShortcut(shortcuts.COLOR.PREVIOUS_COLOR, this.selectPreviousColor_.bind(this));
    pskl.app.shortcutService.registerShortcut(shortcuts.COLOR.NEXT_COLOR, this.selectNextColor_.bind(this));
    pskl.app.shortcutService.registerShortcut(shortcuts.COLOR.SELECT_COLOR, this.selectColorForKey_.bind(this));

    this.fillPaletteList();
    this.updateFromUserSettings();
    this.fillColorListContainer();
  };

  ns.PalettesListController.prototype.onToolEvent_ = function (evt, tool) {
    this.showColorCycles = tool.toolId === 'tool-shift-index';
    this.highlightSelectedColors();
  };

  ns.PalettesListController.prototype.fillPaletteList = function () {
    var palettes = this.paletteService.getPalettes();

    var html = palettes.map(function (palette) {
      return pskl.utils.Template.replace('<option value="{{id}}">{{name}}</option>', palette);
    }).join('');
    this.colorPaletteSelect_.innerHTML = html;
  };

  ns.PalettesListController.prototype.fillColorListContainer = function () {
    var colors = this.getSelectedPaletteColors_();

    if (colors.length > 0) {
      var html = colors.filter(function (color) {
        return !!color;
      }).map(function (color, index) {
        return pskl.utils.Template.replace(this.paletteColorTemplate_, {
          color : color,
          index : index + 1,
          title : color.toUpperCase()
        });
      }.bind(this)).join('');
      this.colorListContainer_.innerHTML = html;

      this.highlightSelectedColors();
    } else {
      this.colorListContainer_.innerHTML = pskl.utils.Template.get('palettes-list-no-colors-partial');
    }

    // If we have more than 10 colors, use tiny mode, where 10 colors will fit on the same
    // line.
    this.colorListContainer_.classList.toggle('tiny', colors.length > 10);
  };

  ns.PalettesListController.prototype.selectPalette = function (paletteId) {
    pskl.UserSettings.set(pskl.UserSettings.SELECTED_PALETTE, paletteId);
    $.publish(Events.CURRENT_PALETTE_CHANGED);
  };

  ns.PalettesListController.prototype.getSelectedPaletteColors_ = function () {
    var colors = [];
    var palette = this.getSelectedPalette_();
    if (palette) {
      colors = palette.getColors();
    }

    if (colors.length > Constants.MAX_PALETTE_COLORS) {
      colors = colors.slice(0, Constants.MAX_PALETTE_COLORS);
    }

    return colors;
  };

  ns.PalettesListController.prototype.getSelectedPalette_ = function () {
    var paletteId = pskl.UserSettings.get(pskl.UserSettings.SELECTED_PALETTE);
    return this.paletteService.getPaletteById(paletteId);
  };

  ns.PalettesListController.prototype.selectNextColor_ = function () {
    this.selectColor_(this.getCurrentColorIndex_() + 1);
  };

  ns.PalettesListController.prototype.selectPreviousColor_ = function () {
    this.selectColor_(this.getCurrentColorIndex_() - 1);
  };

  ns.PalettesListController.prototype.getCurrentColorIndex_ = function () {
    var currentIndex = 0;
    var selectedColor = document.querySelector('.' + PRIMARY_COLOR_CLASSNAME);
    if (selectedColor) {
      currentIndex = parseInt(selectedColor.dataset.colorIndex, 10) - 1;
    }
    return currentIndex;
  };

  ns.PalettesListController.prototype.selectColorForKey_ = function (key) {
    var index = parseInt(key, 10);
    index = (index + 9) % 10;
    this.selectColor_(index);
  };

  ns.PalettesListController.prototype.selectColor_ = function (index) {
    var colors = this.getSelectedPaletteColors_();
    var color = colors[index];
    if (color) {
      $.publish(Events.SELECT_PRIMARY_COLOR, [color]);
    }
  };

  ns.PalettesListController.prototype.onUserSettingsChange_ = function (evt, name, value) {
    if (name == pskl.UserSettings.SELECTED_PALETTE) {
      this.updateFromUserSettings();
    }
  };

  ns.PalettesListController.prototype.updateFromUserSettings = function () {
    var paletteId = pskl.UserSettings.get(pskl.UserSettings.SELECTED_PALETTE);
    this.fillColorListContainer();
    this.colorPaletteSelect_.value = paletteId;
  };

  ns.PalettesListController.prototype.onPaletteSelected_ = function (evt) {
    var paletteId = this.colorPaletteSelect_.value;
    this.selectPalette(paletteId);
    this.colorPaletteSelect_.blur();
  };

  ns.PalettesListController.prototype.onCreatePaletteClick_ = function (evt) {
    var paletteId = this.colorPaletteSelect_.value;
    $.publish(Events.DIALOG_SHOW, {
      dialogId : 'create-palette',
      initArgs : paletteId
    });
  };

  ns.PalettesListController.prototype.onEditPaletteClick_ = function (evt) {
    var paletteId = this.colorPaletteSelect_.value;
    $.publish(Events.DIALOG_SHOW, {
      dialogId : 'create-palette',
      initArgs : paletteId
    });
  };

  ns.PalettesListController.prototype.onColorContainerContextMenu = function (event) {
    event.preventDefault();
  };

  ns.PalettesListController.prototype.onColorContainerMouseup = function (event) {
    var target = event.target;
    var color = target.dataset.color;

    if (color) {
      if (event.button == Constants.LEFT_BUTTON) {
        $.publish(Events.SELECT_PRIMARY_COLOR, [color]);
      } else if (event.button == Constants.RIGHT_BUTTON) {
        $.publish(Events.SELECT_SECONDARY_COLOR, [color]);
      }
    }
  };

  ns.PalettesListController.prototype.highlightSelectedColors = function () {
    var colorPalette = pskl.app.palettesListController.getSelectedPaletteColors_();
    colorPalette.forEach(function(color, index) {
      pskl.app.palettesListController.getColorContainer_(color)
      .classList.remove(PRIMARY_COLOR_CLASSNAME);
      pskl.app.palettesListController.getColorContainer_(color)
      .classList.remove(SECONDARY_COLOR_CLASSNAME);
      pskl.app.palettesListController.getColorContainer_(color)
      .classList.remove(CYCLED_COLOR_CLASSNAME);
    });

    var secondaryColorContainer = this.getColorContainer_(pskl.app.selectedColorsService.getSecondaryColor());
    if (secondaryColorContainer) {
      secondaryColorContainer.classList.remove(PRIMARY_COLOR_CLASSNAME);
      secondaryColorContainer.classList.add(SECONDARY_COLOR_CLASSNAME);
    }

    var primaryColorContainer = this.getColorContainer_(pskl.app.selectedColorsService.getPrimaryColor());
    if (primaryColorContainer) {
      primaryColorContainer.classList.remove(SECONDARY_COLOR_CLASSNAME);
      primaryColorContainer.classList.add(PRIMARY_COLOR_CLASSNAME);
    }

    this.primaryColorIndex =
      !!primaryColorContainer ? colorPalette.indexOf(pskl.app.selectedColorsService.getPrimaryColor()) : -1;
    // Display cycling colors while using the Shift index brush
    if (!primaryColorContainer || !secondaryColorContainer) { return; }
    var startPoint = colorPalette.indexOf(pskl.app.selectedColorsService.getPrimaryColor());
    var endPoint = colorPalette.indexOf(pskl.app.selectedColorsService.getSecondaryColor());
    if (startPoint === endPoint) { return; }
    var range = endPoint + 1 - startPoint ;
    if (this.showColorCycles && range > 0) {
      colorPalette.splice(0, endPoint + 1);
      colorPalette.forEach(function(color, index) {
        var colorNumber = index + 1;
        if (colorNumber % range === 1) {
          pskl.app.palettesListController.getColorContainer_(color).classList.add(PRIMARY_COLOR_CLASSNAME);
          pskl.app.palettesListController.getColorContainer_(color).classList.add(CYCLED_COLOR_CLASSNAME);
        }
        if (colorNumber % range === 0) {
          pskl.app.palettesListController.getColorContainer_(color).classList.add(SECONDARY_COLOR_CLASSNAME);
          pskl.app.palettesListController.getColorContainer_(color).classList.add(CYCLED_COLOR_CLASSNAME);
        }
      });
    }
  };

  ns.PalettesListController.prototype.getColorContainer_ = function (color) {
    return this.colorListContainer_.querySelector('.palettes-list-color[data-color="' + color + '"]');
  };

  ns.PalettesListController.prototype.removeClass_ = function (cssClass) {
    var element = document.querySelector('.' + cssClass);
    if (element) {
      element.classList.remove(cssClass);
    }
  };

  ns.PalettesListController.prototype.onPaletteListUpdated = function () {
    this.fillPaletteList();
    this.updateFromUserSettings();
  };
})();
