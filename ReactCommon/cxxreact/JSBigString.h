// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <fcntl.h>
#include <sys/mman.h>

#include <folly/Exception.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

// JSExecutor functions sometimes take large strings, on the order of
// megabytes.  Copying these can be expensive.  Introducing a
// move-only, non-CopyConstructible type will let the compiler ensure
// that no copies occur.  folly::MoveWrapper should be used when a
// large string needs to be curried into a std::function<>, which must
// by CopyConstructible.

class JSBigString {
public:
  JSBigString() = default;

  // Not copyable
  JSBigString(const JSBigString&) = delete;
  JSBigString& operator=(const JSBigString&) = delete;

  virtual ~JSBigString() {}

  virtual bool isAscii() const = 0;
  virtual const char* c_str() const = 0;
  virtual size_t size() const = 0;
};

// Concrete JSBigString implementation which holds a std::string
// instance.
class JSBigStdString : public JSBigString {
public:
  JSBigStdString(std::string str, bool isAscii=false)
  : m_isAscii(isAscii)
  , m_str(std::move(str)) {}

  bool isAscii() const override {
    return m_isAscii;
  }

  const char* c_str() const override {
    return m_str.c_str();
  }

  size_t size() const override {
    return m_str.size();
  }

private:
  bool m_isAscii;
  std::string m_str;
};

// Concrete JSBigString implementation which holds a heap-allocated
// buffer, and provides an accessor for writing to it.  This can be
// used to construct a JSBigString in place, such as by reading from a
// file.
class JSBigBufferString : public JSBigString {
public:
  JSBigBufferString(size_t size)
  : m_data(new char[size + 1])
  , m_size(size) {
    // Guarantee nul-termination.  The caller is responsible for
    // filling in the rest of m_data.
    m_data[m_size] = '\0';
  }

  ~JSBigBufferString() {
    delete[] m_data;
  }

  bool isAscii() const override {
    return true;
  }

  const char* c_str() const override {
    return m_data;
  }

  size_t size() const override {
    return m_size;
  }

  char* data() {
    return m_data;
  }

private:
  char* m_data;
  size_t m_size;
};

// JSBigString interface implemented by a file-backed mmap region.
class RN_EXPORT JSBigFileString : public JSBigString {
public:

  JSBigFileString(int fd, size_t size, off_t offset = 0)
  : m_fd   {-1}
  , m_data {nullptr}
  {
    folly::checkUnixError(
                          m_fd = dup(fd),
                          "Could not duplicate file descriptor");

    // Offsets given to mmap must be page aligend. We abstract away that
    // restriction by sending a page aligned offset to mmap, and keeping track
    // of the offset within the page that we must alter the mmap pointer by to
    // get the final desired offset.
    auto ps = getpagesize();
    auto d  = lldiv(offset, ps);

    m_mapOff  = d.quot;
    m_pageOff = d.rem;
    m_size    = size + m_pageOff;
  }

  ~JSBigFileString() {
    if (m_data) {
      munmap((void *)m_data, m_size);
    }
    close(m_fd);
  }

  bool isAscii() const override {
    return true;
  }

  const char *c_str() const override {
    if (!m_data) {
      m_data = (const char *)mmap(0, m_size, PROT_READ, MAP_SHARED, m_fd, m_mapOff);
      CHECK(m_data != MAP_FAILED)
      << " fd: " << m_fd
      << " size: " << m_size
      << " offset: " << m_mapOff
      << " error: " << std::strerror(errno);
    }
    return m_data + m_pageOff;
  }

  size_t size() const override {
    return m_size - m_pageOff;
  }

  int fd() const {
    return m_fd;
  }

  static std::unique_ptr<const JSBigFileString> fromPath(const std::string& sourceURL);

private:
  int m_fd;                     // The file descriptor being mmaped
  size_t m_size;                // The size of the mmaped region
  size_t m_pageOff;             // The offset in the mmaped region to the data.
  off_t m_mapOff;               // The offset in the file to the mmaped region.
  mutable const char *m_data;   // Pointer to the mmaped region.
};

class JSBigOptimizedBundleString : public JSBigString  {
public:
  enum class Encoding {
    Unknown,
    Ascii,
    Utf8,
    Utf16,
  };

  JSBigOptimizedBundleString(int fd, size_t size, const uint8_t sha1[20], Encoding encoding) :
  m_fd(-1),
  m_size(size),
  m_encoding(encoding),
  m_str(nullptr)
  {
    folly::checkUnixError(
                          m_fd = dup(fd),
                          "Could not duplicate file descriptor");

    memcpy(m_hash, sha1, 20);
  }

  ~JSBigOptimizedBundleString() {
    if (m_str) {
      CHECK(munmap((void *)m_str, m_size) != -1);
    }
    close(m_fd);
  }

  bool isAscii() const override {
    return m_encoding == Encoding::Ascii;
  }

  const char* c_str() const override {
    if (!m_str) {
      m_str = (const char *)mmap(0, m_size, PROT_READ, MAP_SHARED, m_fd, 0);
      CHECK(m_str != MAP_FAILED);
    }
    return m_str;
  }

  size_t size() const override {
    return m_size;
  }

  int fd() const {
    return m_fd;
  }

  const uint8_t* hash() const {
    return m_hash;
  }

  Encoding encoding() const {
    return m_encoding;
  }

  static std::unique_ptr<const JSBigOptimizedBundleString> fromOptimizedBundle(const std::string& bundlePath);

private:
  int m_fd;
  size_t m_size;
  uint8_t m_hash[20];
  Encoding m_encoding;
  mutable const char *m_str;
};

} }
