import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

class InteractivePhaseEditor:
    def __init__(self):
        self.fig, self.ax = plt.subplots()
        self.ax.set_xlim(0, 10)
        self.ax.set_ylim(0, 5)
        self.ax.set_xlabel('Время')
        self.ax.set_ylabel('Расстояние')

        # Создаём тестовые прямоугольники (фазы)
        self.rectangles = []
        self.add_rectangle(1, 1, 2, 3)  # x, y, width, height
        self.add_rectangle(4, 1, 1, 2)

        # Переменные для перемещения
        self.dragging = False
        self.selected_rect = None
        self.resize_mode = False
        self.start_x = 0

        # Подключаем события
        self.fig.canvas.mpl_connect('button_press_event', self.on_click)
        self.fig.canvas.mpl_connect('button_release_event', self.on_release)
        self.fig.canvas.mpl_connect('motion_notify_event', self.on_motion)

    def add_rectangle(self, x, y, width, height):
        rect = Rectangle((x, y), width, height, alpha=0.3, picker=True)
        self.ax.add_patch(rect)
        self.rectangles.append(rect)
        self.fig.canvas.draw()

    def on_click(self, event):
        if event.inaxes != self.ax:
            return

        for rect in self.rectangles:
            contains, _ = rect.contains(event)
            if contains:
                self.selected_rect = rect
                self.dragging = True
                self.start_x = event.xdata

                # Проверяем, кликнули ли около правой границы (для растягивания)
                rect_x, rect_y = rect.get_xy()
                rect_width = rect.get_width()
                if abs(event.xdata - (rect_x + rect_width)) < 0.5:  # Порог близости к границе
                    self.resize_mode = True
                else:
                    self.resize_mode = False
                break

    def on_release(self, event):
        self.dragging = False
        self.selected_rect = None
        self.resize_mode = False

    def on_motion(self, event):
        if not self.dragging or self.selected_rect is None or event.inaxes != self.ax:
            return

        current_x = event.xdata
        dx = current_x - self.start_x

        rect_x, rect_y = self.selected_rect.get_xy()
        rect_width = self.selected_rect.get_width()

        if self.resize_mode:
            # Растягиваем прямоугольник
            new_width = max(0.1, rect_width + dx)  # Чтобы ширина не стала <= 0
            self.selected_rect.set_width(new_width)
        else:
            # Перемещаем прямоугольник
            self.selected_rect.set_x(rect_x + dx)

        self.start_x = current_x
        self.fig.canvas.draw()

editor = InteractivePhaseEditor()
plt.show()
