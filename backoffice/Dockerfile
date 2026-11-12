
FROM php:8.4-apache

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libonig-dev \
    libzip-dev \
    unzip \
    git \
    && docker-php-ext-install \
        pdo_pgsql \
        mbstring \
        zip \
    && rm -rf /var/lib/apt/lists/*

# Ativar URL rewriting do Laravel
RUN a2enmod rewrite

# Configurar Apache para servir a pasta public
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri \
    's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/*.conf

RUN sed -i 's/Listen 80/Listen 10000/' \
    /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:10000>/' \
    /etc/apache2/sites-available/000-default.conf

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

# Instalar dependências de produção
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

# Permissões necessárias ao Laravel
RUN mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 10000

CMD ["sh", "-c", "php artisan migrate --force && exec apache2-foreground"]
