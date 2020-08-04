// generated on 2020-07-29 using generator-webapp 4.0.0-8
const { src, dest, watch, series, parallel, lastRun } = require('gulp')
const gulpLoadPlugins = require('gulp-load-plugins')
const browserSync = require('browser-sync')
const del = require('del')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const { argv } = require('yargs')

const $ = gulpLoadPlugins()
const server = browserSync.create()

const port = argv.port || 9000

const isProd = process.env.NODE_ENV === 'production'
const isDev = !isProd

const DIST_DIR = 'docs'

function styles() {
  return src('app/styles/*.scss', {
    sourcemaps: !isProd,
  })
    .pipe($.plumber())
    .pipe(
      $.sass
        .sync({
          outputStyle: 'expanded',
          precision: 10,
          includePaths: ['.'],
        })
        .on('error', $.sass.logError)
    )
    .pipe($.postcss([autoprefixer()]))
    .pipe(
      dest('.tmp/styles', {
        sourcemaps: !isProd,
      })
    )
    .pipe(server.reload({ stream: true }))
}

function scripts() {
  return src('app/scripts/**/*.js', {
    sourcemaps: !isProd,
  })
    .pipe($.plumber())
    .pipe($.babel())
    .pipe(
      dest('.tmp/scripts', {
        sourcemaps: !isProd ? '.' : false,
      })
    )
    .pipe(server.reload({ stream: true }))
}

const lintBase = (files, options) => {
  return src(files)
    .pipe($.eslint(options))
    .pipe(server.reload({ stream: true, once: true }))
    .pipe($.eslint.format())
    .pipe($.if(!server.active, $.eslint.failAfterError()))
}
function lint() {
  return lintBase('app/scripts/**/*.js', { fix: true }).pipe(
    dest('app/scripts')
  )
}

function html() {
  return src('app/*.html')
    .pipe($.useref({ searchPath: ['.tmp', 'app', '.'] }))
    .pipe($.if(/\.js$/, $.uglify({ compress: { drop_console: true } })))
    .pipe(
      $.if(/\.css$/, $.postcss([cssnano({ safe: true, autoprefixer: false })]))
    )
    .pipe(
      $.if(
        /\.html$/,
        $.htmlmin({
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: { compress: { drop_console: true } },
          processConditionalComments: true,
          removeComments: true,
          removeEmptyAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
        })
      )
    )
    .pipe(dest(DIST_DIR))
}

function images() {
  return src('app/images/**/*', { since: lastRun(images) })
    .pipe($.imagemin())
    .pipe(dest(`${DIST_DIR}/images`))
}

function fonts() {
  return src('app/fonts/**/*.{eot,svg,ttf,woff,woff2}').pipe(
    $.if(!isProd, dest('.tmp/fonts'), dest(`${DIST_DIR}/fonts`))
  )
}

function extras() {
  return src(['app/*', '!app/*.html'], {
    dot: true,
  }).pipe(dest(DIST_DIR))
}

function clean() {
  return del(['.tmp', DIST_DIR])
}

function measureSize() {
  return src(`${DIST_DIR}/**/*`).pipe($.size({ title: 'build', gzip: true }))
}

const build = series(
  clean,
  parallel(
    lint,
    series(parallel(styles, scripts), html),
    images,
    fonts,
    extras
  ),
  measureSize
)

function startAppServer() {
  server.init({
    notify: false,
    port,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/node_modules': 'node_modules',
      },
    },
  })

  watch(['app/*.html', 'app/images/**/*', '.tmp/fonts/**/*']).on(
    'change',
    server.reload
  )

  watch('app/styles/**/*.scss', styles)
  watch('app/scripts/**/*.js', scripts)
  watch('app/fonts/**/*', fonts)
}

function startDistServer() {
  server.init({
    notify: false,
    port,
    server: {
      baseDir: DIST_DIR,
      routes: {
        '/node_modules': 'node_modules',
      },
    },
  })
}

let serve
if (isDev) {
  serve = series(clean, parallel(styles, scripts, fonts), startAppServer)
} else if (isProd) {
  serve = series(build, startDistServer)
}

exports.serve = serve
exports.build = build
exports.default = build
