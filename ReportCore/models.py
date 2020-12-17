from django.db import models
from django.utils.translation import ugettext_lazy as _
from AuthCore.models import User

class Report(models.Model):
    # SYMPTOMS = [
    #     ('TP', 'Повышение температуры тела'),
    #     ('DC', 'Сухой кашель'),
    #     ('FT', 'Утомляемость'),
    #     ('PS', 'Различные болевые ощущения'),
    #     ('ST', 'Боль в горле'),
    #     ('DR', 'Диарея'),
    #     ('CN', 'Конъюнктивит'),
    #     ('HD', 'Головная боль'),
    #     ('LT', 'Потеря обоняния и вкусовых ощущений'),
    #     ('SR', 'Сыпь на коже'),
    #     ('DB', 'Затрудненное дыхание или одышка'),
    #     ('CP', 'Боль в грудной клетке'),
    #     ('MF', 'Нарушение речи или двигательных функций')
    # ]
    STATUSES = [
        ('W', 'Ожидание результатов теста'),
        ('P', 'Результат положительный'),
        ('N', 'Результат отрицательный')
    ]
    CONTACTS = [
        ('N', 'Контакта с носителями не наблюдалось'),
        ('A', 'Был в контакте с заражёнными'),
        ('P', 'Был в контакте с потенциальными носителями')
    ]

    id = models.AutoField(_("Идентификатор репорта"), primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    reportTime = models.DateField(_("Дата репорта"), auto_now_add=True)
    reportEndTime = models.DateField(_("Дата окончания действия репорта"), null=True)
    symptoms = models.CharField(_("Симптомы"), max_length=50, blank=True)
    status = models.CharField(_("Состояние"), max_length=1, choices=STATUSES, default='W')
    contact = models.CharField(_("Контакты"), max_length=1, choices=CONTACTS, default='N')
    places = models.TextField(_("Места пребывания"), blank=True)
    features = models.TextField(_("Записи в HERE Data Hub"), blank=True)